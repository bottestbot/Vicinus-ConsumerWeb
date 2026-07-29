import { Injectable, NotFoundException } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { PrismaService } from '../../prisma/prisma.service'
import { RedisService } from '../../common/redis/redis.service'
import { GoogleMapsProxyService } from './google-maps-proxy.service'
import { PersonalizationService, PersonalizationResult } from './scoring/personalization.service'
import { SubScores, WEIGHTS_VERSION } from './scoring/blend'
import { haversineMeters, LatLng } from './scoring/geo'
import { TRANSIT_CATEGORIES } from './poi-ingestion.service'

const NEIGHBOURHOOD_TTL = 30 * 60
// Personalized block is per-user and cheaper to recompute — shorter TTL.
const PERSONALIZATION_TTL = 10 * 60

// Housing-age sample: same 1.5 km disc the POI and vibe ingests use, so the
// card's "1.5 km" framing means the same thing everywhere on the page.
const HOUSING_AGE_RADIUS_M = 1500
// Below this, a median build year is an anecdote, not a neighbourhood fact.
const HOUSING_AGE_MIN_SAMPLE = 15
const HOUSING_ERAS = [
  { label: 'Pre-1960', from: 1800, to: 1959 },
  { label: '1960s–70s', from: 1960, to: 1979 },
  { label: '1980s–90s', from: 1980, to: 1999 },
  { label: '2000s–10s', from: 2000, to: 2019 },
  { label: '2020s', from: 2020, to: 2100 },
] as const

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
        centroidLat: true,
        centroidLng: true,
      },
      orderBy: { name: 'asc' },
    })

    const result: NeighbourhoodSummary[] = rows.map(toSummary)

    // Most neighbourhood rows have no hand-curated `medianPrice` (only a small
    // seed set does) — backfill the rest from active DDF listings so the card
    // grid isn't mostly blank. Bulk in-memory computation, not N per-neighbourhood
    // DB queries: `Property.city`/`lat`/`lng` are unindexed, so 100+ scoped
    // queries per cache refresh would be 100+ full table scans.
    const missing = result.filter((n) => n.medianPrice == null)
    if (missing.length > 0) {
      const livePrices = await this.computeBulkMedianPrices(missing)
      for (const n of result) {
        if (n.medianPrice == null) {
          n.medianPrice = livePrices.get(n.slug) ?? null
        }
      }
    }

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
        centroidLat: true,
        centroidLng: true,
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
        leaseAmount: true,
        beds: true,
        baths: true,
        images: true,
      },
      orderBy: { listedAt: 'desc' },
      take: 12,
    })

    const result: ListingSummary[] = properties.map((p) => ({
      // JUL21FIX-01/02: DDF ListingKey, not the local cuid — the FE routes
      // /properties/:id by this and would 404 on the Prisma id.
      id: p.ddfListingKey,
      listingKey: p.ddfListingKey,
      address: p.address,
      city: p.city,
      // JUL21FIX-04: rentals price via LeaseAmount, not ListPrice.
      listPrice: p.price ?? p.leaseAmount,
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

    const personalization = await this.resolvePersonalization(slug, base, clerkId)
    return { ...base, personalization }
  }

  /**
   * Per-user personalization on its own.
   *
   * The detail page is server-rendered and its response is shared-cached, so it
   * cannot carry a user's match: no auth header reaches the API, and caching a
   * per-user block there would serve one user's match to everyone. The client
   * fetches this endpoint separately once Clerk has a session.
   */
  async getPersonalization(slug: string, clerkId?: string): Promise<DetailPersonalization | null> {
    if (!clerkId) return null
    const base = await this.getDetailBase(slug)
    return this.resolvePersonalization(slug, base, clerkId)
  }

  private async resolvePersonalization(
    slug: string,
    base: NeighbourhoodDetailBase,
    clerkId?: string,
  ): Promise<DetailPersonalization | null> {
    if (!clerkId) return null

    const pKey = `neighbourhood:${slug}:personalization:${clerkId}`
    const cached = await this.redis.get(pKey)
    if (cached) return JSON.parse(cached) as DetailPersonalization

    const sub: SubScores = {
      walkability: base.livability.breakdown.walkability,
      schools: base.livability.breakdown.schools,
      amenities: base.livability.breakdown.amenities,
      transit: base.livability.breakdown.transit,
    }
    const result: PersonalizationResult = await this.personalization.personalize(sub, clerkId)
    // FE contract types matchPercent as a plain number (0 = no signal).
    const personalization: DetailPersonalization = {
      ...result,
      matchPercent: result.matchPercent ?? 0,
    }
    await this.redis.set(pKey, JSON.stringify(personalization), PERSONALIZATION_TTL)
    return personalization
  }

  /**
   * Fetch a Static Map / Street View tile image for a neighbourhood, server-side.
   * Returns null when there is no key or no centroid, so the controller can 404
   * rather than emit a broken image.
   */
  async getTileImage(slug: string, kind: 'map' | 'street-view') {
    const row = await this.prisma.neighbourhood.findUnique({
      where: { slug },
      select: { lat: true, lng: true, centroidLat: true, centroidLng: true },
    })
    if (!row) throw new NotFoundException(`Neighbourhood "${slug}" not found`)
    const lat = row.centroidLat ?? row.lat
    const lng = row.centroidLng ?? row.lng
    if (lat == null || lng == null) return null
    return this.maps.fetchTileImage(kind, lat, lng)
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
        boundary: true,
        walkabilityScore: true,
        transitSubScore: true,
        schoolsScore: true,
        amenitiesScore: true,
        livabilityScore: true,
        livabilityPercentile: true,
        referenceRegion: true,
      },
    })
    if (!row) throw new NotFoundException(`Neighbourhood "${slug}" not found`)

    const centroidLat = row.centroidLat ?? row.lat
    const centroidLng = row.centroidLng ?? row.lng
    const centroid =
      centroidLat != null && centroidLng != null ? { lat: centroidLat, lng: centroidLng } : null

    const [marketSnapshot, localEssentials, liveListings, housingAge] = await Promise.all([
      this.getMarketSnapshot(row),
      this.getLocalEssentials(row.id, centroid),
      this.getDetailListings(row),
      this.getHousingAge(centroid),
    ])

    const photos = Array.isArray(row.photos) ? (row.photos as string[]) : []

    // Numeric fields are coerced to 0 rather than null: the FE contract
    // (NeighbourhoodDetailResponse) types them as `number` and treats 0 as
    // "unknown" (e.g. the livability panel hides "Top X%" when percentile is 0).
    // `transit` stays nullable — the FE explicitly models a no-GTFS area.
    const base: NeighbourhoodDetailBase = {
      neighbourhood: {
        id: row.id,
        slug: row.slug,
        name: row.name,
        city: row.city ?? '',
        description: row.bio ?? '',
        heroImageUrl: photos[0] ?? '',
        flavors: [],
        centroidLat: centroidLat ?? 0,
        centroidLng: centroidLng ?? 0,
        boundary: (row.boundary as BoundaryGeometry | null) ?? null,
      },
      marketSnapshot,
      livability: {
        score: row.livabilityScore ?? 0,
        percentile: row.livabilityPercentile ?? 0,
        breakdown: {
          walkability: row.walkabilityScore ?? 0,
          schools: row.schoolsScore ?? 0,
          amenities: row.amenitiesScore ?? 0,
          transit: row.transitSubScore ?? null,
        },
        // The pool the percentile was actually ranked against (province by
        // default). The FE must label "Top X%" with this, not the city — they
        // are different, and saying "Top 1% in Mission" for a province-wide
        // rank is simply a false claim.
        region: row.referenceRegion,
        weightsVersion: WEIGHTS_VERSION,
      },
      localEssentials,
      housingAge,
      // Proxied API paths, NOT Google URLs — the direct URLs carry the API key
      // and must never reach the browser. The FE prefixes these with its API
      // base. These are image sources for the tiles, not interactive links:
      // the FE builds google.com/maps deep links from the centroid for that.
      localInfoTiles: {
        staticMapUrl: centroid ? `/neighbourhoods/${slug}/tile/map` : null,
        streetViewUrl: centroid ? `/neighbourhoods/${slug}/tile/street-view` : null,
      },
      liveListings,
    }

    await this.redis.set(cacheKey, JSON.stringify(base), NEIGHBOURHOOD_TTL)
    return base
  }

  // Bulk version of getMarketSnapshot's price half — one query for every
  // neighbourhood instead of one query per neighbourhood. Buckets active
  // listings by lowercased city (the dominant match in buildLocationClauses)
  // and takes each neighbourhood's median from its bucket. Below a minimum
  // sample size a "median" is more noise than signal, so it's left unset
  // rather than showing a price derived from 1-2 listings.
  private async computeBulkMedianPrices(
    neighbourhoods: Array<{ slug: string; city: string | null }>,
  ): Promise<Map<string, number>> {
    const MIN_SAMPLE = 3
    const cities = [...new Set(neighbourhoods.map((n) => n.city).filter((c): c is string => !!c))]
    if (cities.length === 0) return new Map()

    const properties = await this.prisma.property.findMany({
      where: {
        status: 'Active',
        displayOnInternet: true,
        price: { gt: 0 },
        city: { in: cities, mode: 'insensitive' },
      },
      select: { price: true, city: true },
    })

    const pricesByCity = new Map<string, number[]>()
    for (const p of properties) {
      if (!p.city || p.price == null) continue
      const key = p.city.toLowerCase()
      const bucket = pricesByCity.get(key)
      if (bucket) bucket.push(p.price)
      else pricesByCity.set(key, [p.price])
    }

    const result = new Map<string, number>()
    for (const n of neighbourhoods) {
      if (!n.city) continue
      const bucket = pricesByCity.get(n.city.toLowerCase())
      if (bucket && bucket.length >= MIN_SAMPLE) {
        result.set(n.slug, Math.round(median(bucket)))
      }
    }
    return result
  }

  // Neighbourhood-scoped market snapshot. Adapts the PropertiesService market
  // cohort pattern (in-JS median over an active sample) but scopes by the
  // neighbourhood's own city + lat/lng box. Unknown values are 0 (not null) to
  // match the FE contract, which treats 0 as "no data" and hides the metric.
  private async getMarketSnapshot(neighbourhood: {
    city: string | null
    lat: number | null
    lng: number | null
  }): Promise<MarketSnapshot> {
    const orClauses = buildLocationClauses(neighbourhood)
    if (orClauses.length === 0) {
      return { medianPrice: 0, priceChange30d: 0, daysOnMarket: 0, activeListings: 0 }
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
    const medianPrice = prices.length ? Math.round(median(prices)) : 0

    const doms = sample
      .filter((p) => p.listedAt !== null)
      .map((p) => Math.floor((Date.now() - (p.listedAt as Date).getTime()) / 86_400_000))
    const daysOnMarket = doms.length ? Math.round(median(doms)) : 0

    return {
      medianPrice,
      // TODO: needs a price-history table to compute a real 30-day trend.
      priceChange30d: 0,
      daysOnMarket,
      activeListings,
    }
  }

  // Housing age for the "Age" essentials card: the median build year of active
  // listings inside the same 1.5 km disc the POI/vibe ingests use, plus the era
  // mix.
  //
  // This is a listings sample, NOT the housing stock — only ~41% of synced DDF
  // rows carry a YearBuilt, and only homes currently for sale are counted. The
  // FE labels it with `sampleSize` for exactly that reason; never present it as
  // "the age of this neighbourhood".
  private async getHousingAge(centroid: LatLng | null): Promise<HousingAge | null> {
    if (!centroid) return null

    const latDelta = HOUSING_AGE_RADIUS_M / 111_000
    const lngDelta =
      HOUSING_AGE_RADIUS_M / (111_000 * Math.cos((centroid.lat * Math.PI) / 180) || 111_000)

    const sample = await this.prisma.property.findMany({
      where: {
        status: 'Active',
        displayOnInternet: true,
        yearBuilt: { gt: 1800 },
        lat: { gte: centroid.lat - latDelta, lte: centroid.lat + latDelta },
        lng: { gte: centroid.lng - lngDelta, lte: centroid.lng + lngDelta },
      },
      select: { yearBuilt: true },
      take: 500,
    })

    const years = sample
      .map((p) => p.yearBuilt)
      .filter((y): y is number => y != null)
      .sort((a, b) => a - b)

    // Too thin a sample is worse than no card — a median over three listings
    // reads as a fact about the whole area. The FE hides the card on null.
    if (years.length < HOUSING_AGE_MIN_SAMPLE) return null

    const eras: HousingAge['eras'] = []
    for (const era of HOUSING_ERAS) {
      const count = years.filter((y) => y >= era.from && y <= era.to).length
      if (count > 0) eras.push({ label: era.label, count })
    }
    eras.sort((a, b) => b.count - a.count)

    return {
      medianYearBuilt: Math.round(median(years)),
      newestYearBuilt: years[years.length - 1],
      oldestYearBuilt: years[0],
      sampleSize: years.length,
      eras: eras.slice(0, 3),
    }
  }

  // Live listings for the detail page. Distinct from getListings(): the detail
  // contract needs sqft + realtorUrl + agent/brokerage/MLS for the REALTOR.ca
  // badge and the listing cards, so it selects those columns directly.
  private async getDetailListings(neighbourhood: {
    city: string | null
    lat: number | null
    lng: number | null
  }): Promise<PropertySummary[]> {
    const orClauses = buildLocationClauses(neighbourhood)
    if (orClauses.length === 0) return []

    const properties = await this.prisma.property.findMany({
      where: { status: 'Active', displayOnInternet: true, OR: orClauses },
      select: {
        id: true,
        ddfListingKey: true,
        address: true,
        city: true,
        price: true,
        leaseAmount: true,
        leaseFrequency: true,
        beds: true,
        baths: true,
        sqft: true,
        images: true,
        realtorUrl: true,
        agent: { select: { fullName: true } },
        office: { select: { name: true } },
      },
      orderBy: { listedAt: 'desc' },
      take: 6,
    })

    return properties.map((p) => ({
      // JUL21FIX-01/02: expose the DDF ListingKey as `id`, never the local cuid.
      // The FE routes /properties/:id and reports CREA events by ListingKey, so
      // handing out the Prisma id here guarantees a 404 (and a bogus analytics
      // event). Same convention as localToDashboardProperty in users.service.
      id: p.ddfListingKey,
      address: p.address ?? p.city ?? 'Address unavailable',
      // JUL21FIX-04: rentals carry their asking price in LeaseAmount, not
      // ListPrice — without this fallback every lease card read "Price on
      // request". Mirrors DdfQueryService's ListPrice ?? LeaseAmount handling.
      price: p.price ?? p.leaseAmount ?? 0,
      leaseAmount: p.leaseAmount,
      leaseFrequency: p.leaseFrequency,
      beds: p.beds ?? 0,
      baths: p.baths ?? 0,
      sqft: p.sqft ?? 0,
      imageUrl: extractMainPhoto(p.images) ?? '',
      // The FE routes property links by DDF ListingKey.
      slug: p.ddfListingKey,
      realtorUrl: p.realtorUrl,
      agentName: p.agent?.fullName ?? null,
      brokerageName: p.office?.name ?? null,
      mlsNumber: p.ddfListingKey,
    }))
  }

  private async getLocalEssentials(
    neighbourhoodId: string,
    centroid: { lat: number; lng: number } | null,
  ): Promise<LocalEssentialsBuckets> {
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
      transit: [],
      transitBus: [],
    }
    if (!latest) return buckets

    // Transit is read separately and uncapped. Bus stops alone can run to the
    // hundreds inside the 1.5 km radius, so sharing one capped, unordered query
    // would let them crowd out rarer categories — and the tile reports the
    // *nearest* stop, which a partial set can't answer correctly.
    // The rest keeps a cap: unordered, so too tight a limit silently drops
    // whole categories in dense areas (City Centre's 251 POIs lost its only
    // station to the old take:200). 1000 covers the densest urban core.
    const [pois, transitPois] = await Promise.all([
      this.prisma.neighbourhoodPoi.findMany({
        where: {
          neighbourhoodId,
          snapshotVersion: latest.snapshotVersion,
          category: { notIn: TRANSIT_CATEGORIES },
        },
        select: { id: true, name: true, category: true, lat: true, lng: true },
        take: 1000,
      }),
      this.prisma.neighbourhoodPoi.findMany({
        where: {
          neighbourhoodId,
          snapshotVersion: latest.snapshotVersion,
          category: { in: TRANSIT_CATEGORIES },
        },
        select: { id: true, name: true, category: true, lat: true, lng: true },
      }),
    ])

    for (const poi of [...pois, ...transitPois]) {
      const p: PoiItem = {
        id: poi.id,
        name: poi.name ?? 'Unnamed',
        category: poi.category,
        lat: poi.lat,
        lng: poi.lng,
        // Straight-line metres from the centroid, per the FE contract.
        distanceM: centroid
          ? Math.round(haversineMeters(centroid, { lat: poi.lat, lng: poi.lng }))
          : 0,
      }
      if (poi.category === 'schools') buckets.schools.push(p)
      else if (poi.category === 'healthcare') buckets.healthcare.push(p)
      else if (poi.category === 'parks') buckets.parks.push(p)
      else if (poi.category === 'transit') buckets.transit.push(p)
      else if (poi.category === 'transit_bus') buckets.transitBus.push(p)
      else if (['grocery', 'restaurants', 'coffee', 'errands'].includes(poi.category))
        buckets.shopAndEat.push(p)
    }

    // Nearest-first within each bucket.
    const lists: PoiItem[][] = [
      buckets.schools,
      buckets.healthcare,
      buckets.parks,
      buckets.shopAndEat,
      buckets.transit,
      buckets.transitBus,
    ]
    for (const list of lists) {
      list.sort((a, b) => a.distanceM - b.distanceM)
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

// These mirror the frontend contract in src/types/neighbourhood-detail.ts
// (NeighbourhoodDetailResponse) field-for-field — getNeighbourhoodDetail()
// returns this payload verbatim, so any drift here breaks the detail page.

export interface MarketSnapshot {
  medianPrice: number
  /** 30-day price change as a signed percentage. 0 until price history exists. */
  priceChange30d: number
  daysOnMarket: number
  activeListings: number
}

/** Build-year profile of the *active listings* near the centroid — not the
 *  housing stock. `sampleSize` must be surfaced wherever this is shown. */
export interface HousingAge {
  medianYearBuilt: number
  newestYearBuilt: number
  oldestYearBuilt: number
  sampleSize: number
  /** Up to three eras, largest first. */
  eras: { label: string; count: number }[]
}

export interface LivabilityBlock {
  score: number
  percentile: number
  breakdown: {
    walkability: number
    schools: number
    amenities: number
    /** Null when no agency GTFS coverage exists for the area. */
    transit: number | null
  }
  /** Pool the percentile was ranked against (e.g. "BC"). Label "Top X%" with this. */
  region: string | null
  weightsVersion: string
}

export interface PoiItem {
  id: string
  name: string
  category: string
  lat: number
  lng: number
  /** Straight-line distance from the neighbourhood centroid, in metres. */
  distanceM: number
}

export interface PropertySummary {
  /** DDF ListingKey — the FE routes /properties/:id by this, never the local cuid. */
  id: string
  address: string
  /** ListPrice, falling back to LeaseAmount for rentals. */
  price: number
  /** Set only for leases, so the FE can render a "/mo" style suffix. */
  leaseAmount?: number | null
  leaseFrequency?: string | null
  beds: number
  baths: number
  sqft: number
  imageUrl: string
  slug: string
  realtorUrl?: string | null
  agentName?: string | null
  brokerageName?: string | null
  mlsNumber?: string | null
}

/** GeoJSON Polygon/MultiPolygon as stored in `Neighbourhood.boundary`. Only a
 *  subset of neighbourhoods have this ingested (see ingest-boundaries.ts). */
export interface BoundaryGeometry {
  type: 'Polygon' | 'MultiPolygon'
  coordinates: number[][][] | number[][][][]
}

export interface DetailNeighbourhood {
  id: string
  slug: string
  name: string
  city: string
  description: string
  heroImageUrl: string
  flavors: string[]
  centroidLat: number
  centroidLng: number
  /** GeoJSON boundary for map overlay; null when not ingested. */
  boundary: BoundaryGeometry | null
}

export interface LocalEssentialsBuckets {
  schools: PoiItem[]
  healthcare: PoiItem[]
  parks: PoiItem[]
  shopAndEat: PoiItem[]
  /** Rail stations (category 'transit') — PDP Transit tile. Empty until the
   *  transit ingest has run for the area. */
  transit: PoiItem[]
  /** Bus stops and exchanges (category 'transit_bus'). Kept separate from rail
   *  so the tile can name a nearest station and a nearest bus stop. */
  transitBus: PoiItem[]
}

export interface LocalInfoTiles {
  staticMapUrl: string | null
  streetViewUrl: string | null
}

export interface NeighbourhoodDetailBase {
  neighbourhood: DetailNeighbourhood
  marketSnapshot: MarketSnapshot
  livability: LivabilityBlock
  localEssentials: LocalEssentialsBuckets
  /** Null when there's no centroid or too thin a listings sample to be honest. */
  housingAge: HousingAge | null
  localInfoTiles: LocalInfoTiles
  liveListings: PropertySummary[]
}

export interface DetailPersonalization extends Omit<PersonalizationResult, 'matchPercent'> {
  matchPercent: number
}

export interface NeighbourhoodDetail extends NeighbourhoodDetailBase {
  personalization: DetailPersonalization | null
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
  centroidLat?: number | null
  centroidLng?: number | null
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
    // Centroid first: it's derived from the official boundary, while `lat`/`lng`
    // is legacy display geocoding that a seed without a Mapbox token leaves
    // null. Listing→neighbourhood resolution reads these, so serving the legacy
    // pair alone silently degraded every property page to the map-only variant.
    // Same precedence the POI ingest uses.
    lat: row.centroidLat ?? row.lat ?? null,
    lng: row.centroidLng ?? row.lng ?? null,
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
