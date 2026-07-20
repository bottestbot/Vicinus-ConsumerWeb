import { Injectable, NotFoundException } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { PrismaService } from '../../prisma/prisma.service'
import { RedisService } from '../../common/redis/redis.service'
import { GoogleMapsProxyService } from './google-maps-proxy.service'
import { PersonalizationService, PersonalizationResult } from './scoring/personalization.service'
import { SubScores, WEIGHTS_VERSION } from './scoring/blend'

const NEIGHBOURHOOD_TTL = 30 * 60
// Personalized block is per-user and cheaper to recompute — shorter TTL.
const PERSONALIZATION_TTL = 10 * 60

@Injectable()
export class NeighbourhoodsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly maps: GoogleMapsProxyService,
    private readonly personalization: PersonalizationService,
  ) {}

  // ── BE-501 ──────────────────────────────────────────────────────────────
  async listAll() {
    const cacheKey = 'neighbourhood:list'
    const cached = await this.redis.get(cacheKey)
    if (cached) return JSON.parse(cached) as NeighbourhoodSummary[]

    const rows = await this.prisma.neighbourhood.findMany({
      select: {
        id: true,
        slug: true,
        name: true,
        city: true,
        province: true,
        bio: true,
        medianPrice: true,
        walkScore: true,
        transitScore: true,
        livingGrade: true,
        photos: true,
        lat: true,
        lng: true,
      },
      orderBy: { name: 'asc' },
    })

    const result: NeighbourhoodSummary[] = rows.map(toSummary)
    await this.redis.set(cacheKey, JSON.stringify(result), NEIGHBOURHOOD_TTL)
    return result
  }

  // ── BE-502 ──────────────────────────────────────────────────────────────
  async findBySlug(slug: string) {
    const cacheKey = `neighbourhood:${slug}`
    const cached = await this.redis.get(cacheKey)
    if (cached) return JSON.parse(cached) as NeighbourhoodSummary

    const row = await this.prisma.neighbourhood.findUnique({
      where: { slug },
      select: {
        id: true,
        slug: true,
        name: true,
        city: true,
        province: true,
        bio: true,
        medianPrice: true,
        walkScore: true,
        transitScore: true,
        livingGrade: true,
        photos: true,
        lat: true,
        lng: true,
      },
    })

    if (!row) throw new NotFoundException(`Neighbourhood "${slug}" not found`)

    const result = toSummary(row)
    await this.redis.set(cacheKey, JSON.stringify(result), NEIGHBOURHOOD_TTL)
    return result
  }

  // ── BE-503 ──────────────────────────────────────────────────────────────
  async getListings(slug: string) {
    const cacheKey = `neighbourhood:${slug}:listings`
    const cached = await this.redis.get(cacheKey)
    if (cached) return JSON.parse(cached) as ListingSummary[]

    const neighbourhood = await this.requireBySlug(slug)

    const orClauses = buildLocationClauses(neighbourhood)

    // No location signal at all → nothing to scope by; return empty rather than
    // every active listing in the country.
    if (orClauses.length === 0) return []

    const properties = await this.prisma.property.findMany({
      where: {
        status: 'Active',
        displayOnInternet: true,
        OR: orClauses,
      },
      select: {
        id: true,
        ddfListingKey: true,
        address: true,
        city: true,
        price: true,
        beds: true,
        baths: true,
        images: true,
      },
      orderBy: { listedAt: 'desc' },
      take: 12,
    })

    const result: ListingSummary[] = properties.map((p) => ({
      id: p.id,
      listingKey: p.ddfListingKey,
      address: p.address,
      city: p.city,
      listPrice: p.price,
      bedrooms: p.beds,
      bathrooms: p.baths,
      mainPhotoUrl: extractMainPhoto(p.images),
    }))

    await this.redis.set(cacheKey, JSON.stringify(result), NEIGHBOURHOOD_TTL)
    return result
  }

  // ── BE-504 ──────────────────────────────────────────────────────────────
  async getEssentials(slug: string) {
    const cacheKey = `neighbourhood:${slug}:essentials`
    const cached = await this.redis.get(cacheKey)
    if (cached) return JSON.parse(cached) as EssentialSummary[]

    const neighbourhood = await this.prisma.neighbourhood.findUnique({
      where: { slug },
      include: {
        localEssentials: {
          select: { id: true, name: true, category: true, distanceKm: true },
          orderBy: { distanceKm: 'asc' },
        },
      },
    })

    if (!neighbourhood) throw new NotFoundException(`Neighbourhood "${slug}" not found`)

    const result: EssentialSummary[] = neighbourhood.localEssentials
    await this.redis.set(cacheKey, JSON.stringify(result), NEIGHBOURHOOD_TTL)
    return result
  }

  // ── BE-505 ──────────────────────────────────────────────────────────────
  async getAgents(slug: string) {
    const cacheKey = `neighbourhood:${slug}:agents`
    const cached = await this.redis.get(cacheKey)
    if (cached) return JSON.parse(cached) as AgentSummary[]

    const neighbourhood = await this.requireBySlug(slug)

    const where: Prisma.AgentWhereInput = neighbourhood.province
      ? { province: neighbourhood.province }
      : {}

    const agents = await this.prisma.agent.findMany({
      where,
      select: {
        id: true,
        fullName: true,
        avatarUrl: true,
        office: { select: { name: true } },
      },
      take: 20,
    })

    const result: AgentSummary[] = agents.map((a) => {
      const full = a.fullName ?? ''
      const sep = full.lastIndexOf(' ')
      return {
        id: a.id,
        firstName: sep > -1 ? full.slice(0, sep) : full,
        lastName: sep > -1 ? full.slice(sep + 1) : '',
        email: null,
        photoUrl: a.avatarUrl,
        brokerage: a.office?.name ?? null,
      }
    })

    await this.redis.set(cacheKey, JSON.stringify(result), NEIGHBOURHOOD_TTL)
    return result
  }

  // ── NBHD-09 ─────────────────────────────────────────────────────────────
  // GET /neighbourhoods/:slug/detail — one aggregate read for the detail page.
  // Reads precomputed livability (no scoring in the request path). The
  // non-personalized block is cached 30min; the personalized block is per-user
  // and cached 10min, merged in only when the caller is signed in.
  async getDetail(slug: string, clerkId?: string): Promise<NeighbourhoodDetail> {
    const base = await this.getDetailBase(slug)

    let personalization: PersonalizationResult | null = null
    if (clerkId) {
      const pKey = `neighbourhood:${slug}:personalization:${clerkId}`
      const cached = await this.redis.get(pKey)
      if (cached) {
        personalization = JSON.parse(cached) as PersonalizationResult
      } else {
        const sub: SubScores = {
          walkability: base.livability.breakdown.walkability,
          schools: base.livability.breakdown.schools,
          amenities: base.livability.breakdown.amenities,
          transit: base.livability.breakdown.transit,
        }
        personalization = await this.personalization.personalize(sub, clerkId)
        await this.redis.set(pKey, JSON.stringify(personalization), PERSONALIZATION_TTL)
      }
    }

    return { ...base, personalization }
  }

  private async getDetailBase(slug: string): Promise<NeighbourhoodDetailBase> {
    const cacheKey = `neighbourhood:${slug}:detail`
    const cached = await this.redis.get(cacheKey)
    if (cached) return JSON.parse(cached) as NeighbourhoodDetailBase

    const row = await this.prisma.neighbourhood.findUnique({
      where: { slug },
      select: {
        id: true,
        slug: true,
        name: true,
        city: true,
        province: true,
        bio: true,
        medianPrice: true,
        walkScore: true,
        transitScore: true,
        livingGrade: true,
        photos: true,
        lat: true,
        lng: true,
        centroidLat: true,
        centroidLng: true,
        walkabilityScore: true,
        transitSubScore: true,
        schoolsScore: true,
        amenitiesScore: true,
        livabilityScore: true,
        livabilityPercentile: true,
      },
    })
    if (!row) throw new NotFoundException(`Neighbourhood "${slug}" not found`)

    const centroidLat = row.centroidLat ?? row.lat
    const centroidLng = row.centroidLng ?? row.lng

    const [marketSnapshot, localEssentials, liveListings] = await Promise.all([
      this.getMarketSnapshot(row),
      this.getLocalEssentials(row.id),
      this.getListings(slug),
    ])

    const base: NeighbourhoodDetailBase = {
      neighbourhood: toSummary(row),
      marketSnapshot,
      livability: {
        score: row.livabilityScore ?? null,
        percentile: row.livabilityPercentile ?? null,
        breakdown: {
          walkability: row.walkabilityScore ?? null,
          schools: row.schoolsScore ?? null,
          amenities: row.amenitiesScore ?? null,
          transit: row.transitSubScore ?? null,
        },
        weightsVersion: WEIGHTS_VERSION,
      },
      localEssentials,
      localInfoTiles: {
        staticMapUrl:
          centroidLat != null && centroidLng != null
            ? this.maps.getStaticMapUrl(centroidLat, centroidLng)
            : null,
        streetViewUrl:
          centroidLat != null && centroidLng != null
            ? this.maps.getStreetViewUrl(centroidLat, centroidLng)
            : null,
      },
      // Live listings: top 6 from the shared neighbourhood listings query.
      liveListings: liveListings.slice(0, 6),
    }

    await this.redis.set(cacheKey, JSON.stringify(base), NEIGHBOURHOOD_TTL)
    return base
  }

  // Neighbourhood-scoped market snapshot. Adapts the PropertiesService market
  // cohort pattern (in-JS median over an active sample) but scopes by the
  // neighbourhood's own city + lat/lng box. `priceChange30d` is null — there is
  // no price-history table to derive a trend from yet.
  private async getMarketSnapshot(neighbourhood: {
    city: string | null
    lat: number | null
    lng: number | null
  }): Promise<MarketSnapshot> {
    const orClauses = buildLocationClauses(neighbourhood)
    if (orClauses.length === 0) {
      return { medianPrice: null, priceChange30d: null, daysOnMarket: null, activeListings: 0 }
    }

    const where: Prisma.PropertyWhereInput = {
      status: 'Active',
      displayOnInternet: true,
      price: { gt: 0 },
      OR: orClauses,
    }

    const [activeListings, sample] = await Promise.all([
      this.prisma.property.count({ where }),
      this.prisma.property.findMany({
        where,
        select: { price: true, listedAt: true },
        take: 200,
      }),
    ])

    const prices = sample.map((p) => p.price).filter((p): p is number => p !== null)
    const medianPrice = prices.length ? Math.round(median(prices)) : null

    const doms = sample
      .filter((p) => p.listedAt !== null)
      .map((p) => Math.floor((Date.now() - (p.listedAt as Date).getTime()) / 86_400_000))
    const daysOnMarket = doms.length ? Math.round(median(doms)) : null

    return {
      medianPrice,
      // TODO: needs a price-history table to compute a real 30-day trend.
      priceChange30d: null,
      daysOnMarket,
      activeListings,
    }
  }

  private async getLocalEssentials(neighbourhoodId: string): Promise<LocalEssentialsBuckets> {
    // Latest POI snapshot only, grouped into the detail page's four buckets.
    const latest = await this.prisma.neighbourhoodPoi.findFirst({
      where: { neighbourhoodId },
      orderBy: { createdAt: 'desc' },
      select: { snapshotVersion: true },
    })
    const buckets: LocalEssentialsBuckets = {
      schools: [],
      healthcare: [],
      parks: [],
      shopAndEat: [],
    }
    if (!latest) return buckets

    const pois = await this.prisma.neighbourhoodPoi.findMany({
      where: { neighbourhoodId, snapshotVersion: latest.snapshotVersion },
      select: { id: true, name: true, category: true, lat: true, lng: true },
      take: 200,
    })

    for (const poi of pois) {
      const p: PoiSummary = {
        id: poi.id,
        name: poi.name,
        category: poi.category,
        lat: poi.lat,
        lng: poi.lng,
      }
      if (poi.category === 'schools') buckets.schools.push(p)
      else if (poi.category === 'healthcare') buckets.healthcare.push(p)
      else if (poi.category === 'parks') buckets.parks.push(p)
      else if (['grocery', 'restaurants', 'coffee', 'errands'].includes(poi.category))
        buckets.shopAndEat.push(p)
    }
    return buckets
  }

  // ── private helpers ──────────────────────────────────────────────────────

  private async requireBySlug(slug: string) {
    const row = await this.prisma.neighbourhood.findUnique({
      where: { slug },
      select: { id: true, city: true, province: true, lat: true, lng: true },
    })
    if (!row) throw new NotFoundException(`Neighbourhood "${slug}" not found`)
    return row
  }
}

// ── response shapes ─────────────────────────────────────────────────────────

export interface NeighbourhoodSummary {
  id: string
  slug: string
  name: string
  city: string | null
  province: string | null
  bio: string | null
  medianPrice: number | null
  walkScore: number | null
  transitScore: number | null
  schoolGrade: string | null
  heroImageUrl: string | null
  photos: string[]
  lat: number | null
  lng: number | null
}

export interface ListingSummary {
  id: string
  listingKey: string
  address: string | null
  city: string | null
  listPrice: number | null
  bedrooms: number | null
  bathrooms: number | null
  mainPhotoUrl: string | null
}

export interface EssentialSummary {
  id: string
  name: string | null
  category: string
  distanceKm: number | null
}

export interface AgentSummary {
  id: string
  firstName: string
  lastName: string
  email: null
  photoUrl: string | null
  brokerage: string | null
}

// ── NBHD-09 detail aggregate shapes ──────────────────────────────────────────

export interface MarketSnapshot {
  medianPrice: number | null
  priceChange30d: number | null
  daysOnMarket: number | null
  activeListings: number
}

export interface LivabilityBlock {
  score: number | null
  percentile: number | null
  breakdown: {
    walkability: number | null
    schools: number | null
    amenities: number | null
    transit: number | null
  }
  weightsVersion: string
}

export interface PoiSummary {
  id: string
  name: string | null
  category: string
  lat: number
  lng: number
}

export interface LocalEssentialsBuckets {
  schools: PoiSummary[]
  healthcare: PoiSummary[]
  parks: PoiSummary[]
  shopAndEat: PoiSummary[]
}

export interface LocalInfoTiles {
  staticMapUrl: string | null
  streetViewUrl: string | null
}

export interface NeighbourhoodDetailBase {
  neighbourhood: NeighbourhoodSummary
  marketSnapshot: MarketSnapshot
  livability: LivabilityBlock
  localEssentials: LocalEssentialsBuckets
  localInfoTiles: LocalInfoTiles
  liveListings: ListingSummary[]
}

export interface NeighbourhoodDetail extends NeighbourhoodDetailBase {
  personalization: PersonalizationResult | null
}

// ── field mappers ────────────────────────────────────────────────────────────

function toSummary(row: {
  id: string
  slug: string
  name: string
  city: string | null
  province: string | null
  bio: string | null
  medianPrice: number | null
  walkScore: number | null
  transitScore: number | null
  livingGrade: string | null
  photos?: Prisma.JsonValue
  lat?: number | null
  lng?: number | null
}): NeighbourhoodSummary {
  const photos = Array.isArray(row.photos) ? (row.photos as string[]) : []
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    city: row.city,
    province: row.province,
    bio: row.bio,
    medianPrice: row.medianPrice,
    walkScore: row.walkScore,
    transitScore: row.transitScore,
    schoolGrade: row.livingGrade,
    heroImageUrl: photos[0] ?? null,
    photos,
    lat: row.lat ?? null,
    lng: row.lng ?? null,
  }
}

function extractMainPhoto(images: Prisma.JsonValue): string | null {
  if (!Array.isArray(images) || images.length === 0) return null
  const arr = images as Array<Record<string, unknown>>
  const primary = arr.find((img) => img['isPrimary'] === true)
  const candidate = primary ?? arr[0]
  const url = candidate?.['url']
  return typeof url === 'string' ? url : null
}

function median(values: number[]): number {
  if (!values.length) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

// Scope properties to a neighbourhood by LOCATION (shared by the listings and
// market-snapshot queries). Match either a case-insensitive city equality or a
// lat/lng box around the neighbourhood's coordinates. Empty array ⇒ no location
// signal, so the caller must avoid an unscoped country-wide query.
function buildLocationClauses(neighbourhood: {
  city: string | null
  lat: number | null
  lng: number | null
}): Prisma.PropertyWhereInput[] {
  const orClauses: Prisma.PropertyWhereInput[] = []
  if (neighbourhood.city) {
    orClauses.push({ city: { equals: neighbourhood.city, mode: 'insensitive' } })
  }
  if (neighbourhood.lat != null && neighbourhood.lng != null) {
    const RADIUS_KM = 8
    const latDelta = RADIUS_KM / 111
    const lngDelta = RADIUS_KM / (111 * Math.cos((neighbourhood.lat * Math.PI) / 180) || 111)
    orClauses.push({
      lat: { gte: neighbourhood.lat - latDelta, lte: neighbourhood.lat + latDelta },
      lng: { gte: neighbourhood.lng - lngDelta, lte: neighbourhood.lng + lngDelta },
    })
  }
  return orClauses
}
