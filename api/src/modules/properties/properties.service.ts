import { Injectable, NotFoundException } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { PrismaService } from '../../prisma/prisma.service'
import { RedisService } from '../../common/redis/redis.service'
import { DdfQueryService } from '../ddf-sync/ddf-query.service'
import { SearchQueryDto } from '../search/dto/search-query.dto'

/** 10-minute TTL for full property detail (BE-408) */
const PROPERTY_DETAIL_TTL = 10 * 60

/** Bounding-box radius in degrees (~5.5 km at Canadian latitudes) */
const NEARBY_DEGREES = 0.05

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Extract the primary (or first) http(s) image URL from the DDF search mapper's
 * `images` (unknown-typed `Array<{ url, order, isPrimary }>`). Only returns
 * http(s) URLs so blank/relative entries don't render as broken cards.
 */
function firstFeaturedImage(images: unknown): string | null {
  if (!Array.isArray(images)) return null
  const imgs = images as Array<{ url?: unknown; isPrimary?: unknown }>
  const isUrl = (u: unknown): u is string => typeof u === 'string' && /^https?:\/\//.test(u)
  const primary = imgs.find((m) => m?.isPrimary && isUrl(m?.url)) ?? imgs.find((m) => isUrl(m?.url))
  return primary && isUrl(primary.url) ? primary.url : null
}

function median(values: number[]): number {
  if (!values.length) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

@Injectable()
export class PropertiesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly ddfQuery: DdfQueryService,
  ) {}

  // ── BE-401 ──────────────────────────────────────────────────────────────
  // GET /properties/:id  — full property detail (cached, see BE-408)
  // ────────────────────────────────────────────────────────────────────────
  async findById(id: string) {
    const cacheKey = `property:${id}`
    const cached = await this.redis.get(cacheKey)
    if (cached) return JSON.parse(cached)

    const property = await this.prisma.property.findUnique({
      where: { id },
      include: {
        agent: true,
        office: true,
        neighbourhood: {
          include: { localEssentials: true },
        },
        openHouses: {
          where: { openHouseDate: { gte: new Date() } },
          orderBy: { openHouseDate: 'asc' },
        },
      },
    })

    if (!property) throw new NotFoundException(`Property ${id} not found`)

    await this.redis.set(cacheKey, JSON.stringify(property), PROPERTY_DETAIL_TTL)
    return property
  }

  // ── BE-402 ──────────────────────────────────────────────────────────────
  // GET /properties/:id/nearby-open-houses
  // Returns upcoming open houses for this listing AND nearby properties.
  // ────────────────────────────────────────────────────────────────────────
  async getNearbyOpenHouses(id: string) {
    const property = await this.prisma.property.findUnique({
      where: { id },
      select: { lat: true, lng: true, ddfListingKey: true },
    })
    if (!property) throw new NotFoundException(`Property ${id} not found`)

    const now = new Date()

    // Open houses tied to this exact listing
    const ownOpenHouses = await this.prisma.openHouse.findMany({
      where: {
        ddfListingKey: property.ddfListingKey,
        openHouseDate: { gte: now },
      },
      include: { property: true },
      orderBy: { openHouseDate: 'asc' },
    })

    // Open houses at nearby properties (bounding box, excludes this listing)
    let nearby: typeof ownOpenHouses = []
    if (property.lat !== null && property.lng !== null) {
      nearby = await this.prisma.openHouse.findMany({
        where: {
          openHouseDate: { gte: now },
          property: {
            id: { not: id },
            lat: { gte: property.lat - NEARBY_DEGREES, lte: property.lat + NEARBY_DEGREES },
            lng: { gte: property.lng - NEARBY_DEGREES, lte: property.lng + NEARBY_DEGREES },
          },
        },
        include: { property: true },
        orderBy: { openHouseDate: 'asc' },
        take: 10,
      })
    }

    return { own: ownOpenHouses, nearby }
  }

  // ── BE-H ────────────────────────────────────────────────────────────────
  // GET /properties/featured — highlight listings for the landing page.
  // Queried LIVE from the DDF feed (the Postgres Property table is no longer
  // synced — search/feed/detail all read DDF on demand), so this now reuses the
  // same DdfQueryService the search uses. Prefers premium active residential BC
  // listings with photos; relaxes the filter if too few come back so the home
  // page's "Curated Highlights" never silently disappears. Cached 10 min.
  // ────────────────────────────────────────────────────────────────────────
  async getFeatured() {
    const cacheKey = 'properties:featured'
    const cached = await this.redis.get(cacheKey)
    if (cached) return JSON.parse(cached)

    // Premium pass first, then a relaxed fallback if it yields too few.
    const premium: SearchQueryDto = {
      listingType: 'For Sale',
      province: 'British Columbia',
      status: 'Active',
      minPrice: 1_000_000,
      minSqft: 1000,
      beds: 3,
    }
    const relaxed: SearchQueryDto = {
      listingType: 'For Sale',
      province: 'British Columbia',
      status: 'Active',
    }

    let featured = this.pickFeatured(await this.fetchFeaturedRows(premium))
    if (featured.length < 3) {
      featured = this.pickFeatured(await this.fetchFeaturedRows(relaxed))
    }

    // Short cache so we don't hammer DDF on every landing-page render.
    if (featured.length > 0) {
      await this.redis.set(cacheKey, JSON.stringify(featured), 600)
    }
    return featured
  }

  private async fetchFeaturedRows(dto: SearchQueryDto): Promise<Record<string, unknown>[]> {
    // Fetch a generous page so we have enough photo-bearing listings to pick 6.
    const { data } = await this.ddfQuery.searchProperties(dto, 0, 24)
    return data as Record<string, unknown>[]
  }

  private pickFeatured(rows: Record<string, unknown>[]) {
    return rows
      .map((p) => ({ p, image: firstFeaturedImage(p['images']) }))
      .filter((r): r is { p: Record<string, unknown>; image: string } => Boolean(r.image))
      .slice(0, 6)
      .map(({ p, image }) => {
        const key = String(p['ddfListingKey'] ?? p['id'])
        return {
          id: key,
          name: (p['address'] as string | null) ?? 'Featured Residence',
          location: [p['city'], p['province']].filter(Boolean).join(', '),
          price: (p['price'] as number | null) ?? null,
          beds: (p['beds'] as number | null) ?? null,
          baths: (p['baths'] as number | null) ?? null,
          sqft: (p['sqft'] as number | null) ?? null,
          image,
          // Task #4: deep-link target for the "Powered by REALTOR.ca" badge.
          realtorUrl: (p['realtorUrl'] as string | null) ?? null,
          badge: 'Featured',
          href: `/properties/${key}`,
        }
      })
  }

  // ── BE-403 ──────────────────────────────────────────────────────────────
  // GET /properties/:id/market-context
  // ────────────────────────────────────────────────────────────────────────
  async getMarketContext(id: string) {
    // The detail page keys properties by DDF ListingKey, not the local UUID, so
    // resolve by either. (The synced Property table holds both.)
    const property = await this.prisma.property.findFirst({
      where: { OR: [{ id }, { ddfListingKey: id }] },
      select: {
        id: true,
        ddfListingKey: true,
        price: true,
        sqft: true,
        city: true,
        propertySubType: true,
        listedAt: true,
        lat: true,
        lng: true,
      },
    })
    if (!property) throw new NotFoundException(`Property ${id} not found`)

    // Days on market — null whenever DDF didn't supply OriginalEntryTimestamp.
    // Tracked explicitly (missingListedDate) so the FE can explain a null
    // demandLevel without guessing why.
    const missingListedDate = property.listedAt === null
    const daysOnMarket = property.listedAt
      ? Math.floor((Date.now() - property.listedAt.getTime()) / 86_400_000)
      : null

    // Price / sqft for subject property
    const pricePerSqft =
      property.price !== null && property.sqft !== null && property.sqft > 0
        ? Math.round(property.price / property.sqft)
        : null

    // Unscoped whole-city active count — informational only ("N active in
    // {city}"), kept separate from the cohort used for median calculations.
    const totalActiveListingsInCity =
      property.city !== null
        ? await this.prisma.property.count({
            where: { city: property.city, status: 'Active', id: { not: property.id }, price: { gt: 0 } },
          })
        : 0

    // Comp cohort: same city + same property subtype + a price/sqft band, not
    // just "same city" — a townhouse shouldn't be benchmarked against a
    // citywide median that includes detached houses.
    const SQFT_BAND = 0.3 // ±30%
    const PRICE_BAND = 0.4 // ±40%
    const sqftRange =
      property.sqft && property.sqft > 0
        ? { gte: Math.round(property.sqft * (1 - SQFT_BAND)), lte: Math.round(property.sqft * (1 + SQFT_BAND)) }
        : undefined
    const priceRange =
      property.price && property.price > 0
        ? { gte: property.price * (1 - PRICE_BAND), lte: property.price * (1 + PRICE_BAND) }
        : undefined

    const cityComps =
      property.city !== null
        ? await this.prisma.property.findMany({
            where: {
              city: property.city,
              status: 'Active',
              id: { not: property.id },
              price: { gt: 0, ...priceRange },
              ...(property.propertySubType ? { propertySubType: property.propertySubType } : {}),
              ...(sqftRange ? { sqft: sqftRange } : {}),
            },
            select: { ddfListingKey: true, price: true, sqft: true, listedAt: true },
            take: 200,
          })
        : []

    // Require a minimum sample before trusting any cohort-derived median —
    // below this, pricePosition/medians are nulled and insufficientComps
    // tells the FE why, instead of silently showing "—".
    const MIN_COMP_SAMPLE_SIZE = 5
    const compSampleSize = cityComps.length
    const insufficientComps = compSampleSize < MIN_COMP_SAMPLE_SIZE

    const prices = cityComps.map((p) => p.price).filter((p): p is number => p !== null)
    const medianPrice = !insufficientComps && prices.length ? Math.round(median(prices)) : null

    const sqftPrices = cityComps
      .filter((p): p is { ddfListingKey: string; price: number; sqft: number; listedAt: Date | null } =>
        p.price !== null && p.sqft !== null && p.sqft > 0,
      )
      .map((p) => p.price / p.sqft)
    const medianPricePerSqft = !insufficientComps && sqftPrices.length ? Math.round(median(sqftPrices)) : null

    const compDom = cityComps
      .filter((p) => p.listedAt !== null)
      .map((p) => Math.floor((Date.now() - (p.listedAt as Date).getTime()) / 86_400_000))
    const medianDaysOnMarket = !insufficientComps && compDom.length ? Math.round(median(compDom)) : null

    // Price position relative to market
    let pricePosition: 'above_market' | 'at_market' | 'below_market' | null = null
    if (!insufficientComps && property.price !== null && medianPrice !== null) {
      const ratio = property.price / medianPrice
      pricePosition = ratio > 1.05 ? 'above_market' : ratio < 0.95 ? 'below_market' : 'at_market'
    }

    // Saves-based demand signal (BE-market-signals): saves on this listing in
    // the trailing 14 days vs. the same-day average across the comp cohort —
    // a save is a much stronger buyer-intent signal than raw listing age.
    const fourteenDaysAgo = new Date(Date.now() - 14 * 86_400_000)
    const cohortKeys = cityComps.map((c) => c.ddfListingKey)
    const [saveVelocity, cohortSaveCounts] = await Promise.all([
      this.prisma.savedProperty.count({
        where: { propertyId: property.ddfListingKey, createdAt: { gte: fourteenDaysAgo } },
      }),
      this.prisma.savedProperty.groupBy({
        by: ['propertyId'],
        where: { propertyId: { in: cohortKeys }, createdAt: { gte: fourteenDaysAgo } },
        _count: { propertyId: true },
      }),
    ])
    const cohortAvgSaveVelocity =
      cohortKeys.length > 0
        ? cohortSaveCounts.reduce((sum, r) => sum + r._count.propertyId, 0) / cohortKeys.length
        : null

    // Demand level — blend of DOM-vs-median and save-velocity-vs-cohort.
    // Computed from whichever signal(s) are actually available; only null
    // when neither is. Saves weighted higher (0.6) than DOM (0.4) since a
    // save is a stronger intent signal than a listing simply being new.
    let demandLevel: 'high' | 'medium' | 'low' | null = null
    {
      const domThreshold = medianDaysOnMarket ?? 30
      const domScore =
        daysOnMarket !== null
          ? daysOnMarket < domThreshold * 0.5
            ? 1
            : daysOnMarket <= domThreshold * 1.5
              ? 0.5
              : 0
          : null
      const saveScore =
        cohortAvgSaveVelocity != null && cohortAvgSaveVelocity > 0
          ? (() => {
              const ratio = saveVelocity / cohortAvgSaveVelocity
              return ratio > 1.5 ? 1 : ratio >= 0.5 ? 0.5 : 0
            })()
          : null

      const score =
        domScore !== null && saveScore !== null
          ? saveScore * 0.6 + domScore * 0.4
          : (saveScore ?? domScore)

      if (score !== null) {
        demandLevel = score >= 0.75 ? 'high' : score >= 0.35 ? 'medium' : 'low'
      }
    }

    return {
      daysOnMarket,
      medianDaysOnMarket,
      price: property.price,
      pricePerSqft,
      medianPrice,
      medianPricePerSqft,
      pricePosition,
      demandLevel,
      totalActiveListingsInCity,
      compSampleSize,
      insufficientComps,
      missingListedDate,
      saveVelocity,
      cohortAvgSaveVelocity,
    }
  }

  // ── BE-404 ──────────────────────────────────────────────────────────────
  // GET /properties/:id/assessment-history
  // DDF only exposes the current tax year; return that as a single-entry
  // array so the frontend table always has a consistent shape.
  // ────────────────────────────────────────────────────────────────────────
  async getAssessmentHistory(id: string) {
    const property = await this.prisma.property.findUnique({
      where: { id },
      select: { taxAnnual: true, taxYear: true },
    })
    if (!property) throw new NotFoundException(`Property ${id} not found`)

    const history: Array<{ year: number; annualTax: number }> = []
    if (property.taxYear !== null && property.taxAnnual !== null) {
      history.push({ year: property.taxYear, annualTax: property.taxAnnual })
    }

    return {
      history,
      source: 'CREA DDF',
      note: 'Only the current assessment year is available from DDF. Historical assessment data is not provided.',
    }
  }

  // ── BE-405 ──────────────────────────────────────────────────────────────
  // GET /properties/:id/sales-history
  // DDF does not expose full transactional history. We return nearby sold
  // comparables as reference data for the frontend SalesHistory table.
  // ────────────────────────────────────────────────────────────────────────
  async getSalesHistory(id: string) {
    const property = await this.prisma.property.findUnique({
      where: { id },
      select: {
        city: true,
        propertySubType: true,
        beds: true,
        sqft: true,
        lat: true,
        lng: true,
      },
    })
    if (!property) throw new NotFoundException(`Property ${id} not found`)

    const where: Prisma.PropertyWhereInput = {
      status: { in: ['Sold', 'Closed'] },
      id: { not: id },
    }

    if (property.city) where.city = property.city

    if (property.lat !== null && property.lng !== null) {
      where.lat = { gte: property.lat - NEARBY_DEGREES, lte: property.lat + NEARBY_DEGREES }
      where.lng = { gte: property.lng - NEARBY_DEGREES, lte: property.lng + NEARBY_DEGREES }
    }

    const comparables = await this.prisma.property.findMany({
      where,
      select: {
        id: true,
        address: true,
        city: true,
        price: true,
        beds: true,
        baths: true,
        sqft: true,
        propertySubType: true,
        listedAt: true,
        ddfModifiedAt: true,
        realtorUrl: true,
        agent: { select: { fullName: true } },
        office: { select: { name: true } },
      },
      orderBy: { ddfModifiedAt: 'desc' },
      take: 10,
    })

    return {
      comparables,
      note: 'Showing nearby sold comparables. Full transaction history is not available via CREA DDF.',
    }
  }

  // ── BE-406 ──────────────────────────────────────────────────────────────
  // GET /properties/:id/similar
  // Same city + property type, price within ±30 %, beds within ±1.
  // ────────────────────────────────────────────────────────────────────────
  async getSimilar(id: string) {
    const property = await this.prisma.property.findUnique({
      where: { id },
      select: {
        price: true,
        beds: true,
        city: true,
        propertySubType: true,
      },
    })
    if (!property) throw new NotFoundException(`Property ${id} not found`)

    const where: Prisma.PropertyWhereInput = {
      status: 'Active',
      id: { not: id },
      displayOnInternet: true,
    }

    if (property.city) where.city = property.city
    if (property.propertySubType) where.propertySubType = property.propertySubType

    if (property.beds !== null) {
      where.beds = {
        gte: Math.max(0, property.beds - 1),
        lte: property.beds + 1,
      }
    }

    if (property.price !== null) {
      where.price = {
        gte: property.price * 0.7,
        lte: property.price * 1.3,
      }
    }

    return this.prisma.property.findMany({
      where,
      include: {
        agent: { select: { fullName: true, jobTitle: true } },
        office: { select: { name: true } },
      },
      orderBy: [{ isCuratorPick: 'desc' }, { listedAt: 'desc' }],
      take: 6,
    })
  }
}
