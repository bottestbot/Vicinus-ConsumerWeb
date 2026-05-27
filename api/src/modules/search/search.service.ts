import { Injectable, Logger } from '@nestjs/common'
import { createHash } from 'crypto'
import { Prisma } from '@prisma/client'
import { PrismaService } from '../../prisma/prisma.service'
import { RedisService } from '../../common/redis/redis.service'
import { SearchQueryDto } from './dto/search-query.dto'

/** 2 minutes — per LLD §8 */
const SEARCH_TTL = 120
/** 5 minutes for map-pins — they are much lighter */
const MAP_PINS_TTL = 300

interface MapPin {
  id: string
  lat: number | null
  lng: number | null
  price: number | null
}

interface SearchResult {
  data: unknown[]
  total: number
  page: number
  limit: number
  totalPages: number
}

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name)

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  // ─── BE-301: Full search with all filter params ──────────────────────────

  async search(dto: SearchQueryDto): Promise<SearchResult> {
    const cacheKey = `search:${this.hashQuery(dto as Record<string, unknown>)}`
    const cached = await this.redis.get(cacheKey)
    if (cached) return JSON.parse(cached) as SearchResult

    const page = dto.page ?? 1
    const limit = Math.min(dto.limit ?? 20, 100)
    const skip = (page - 1) * limit

    let result: SearchResult

    // BE-302: route through PostGIS bbox when a bounding box is supplied
    if (dto.bbox) {
      result = await this.bboxSearch(dto, skip, limit)
    } else {
      result = await this.prismaSearch(dto, skip, limit)
    }

    // BE-305: cache the result for 2 minutes
    await this.redis.set(cacheKey, JSON.stringify(result), SEARCH_TTL)
    return result
  }

  // ─── BE-304: Lightweight map-pin endpoint ───────────────────────────────

  async getMapPins(bbox: string): Promise<MapPin[]> {
    const cacheKey = `map-pins:${this.hashQuery({ bbox })}`
    const cached = await this.redis.get(cacheKey)
    if (cached) return JSON.parse(cached) as MapPin[]

    const coords = this.parseBbox(bbox)
    if (!coords) return []
    const { west, south, east, north } = coords

    // BE-302 / BE-304: PostGIS ST_MakeEnvelope bounding box — returns only
    // id, lat, lng, price (lightweight — no JOINs, no heavy columns)
    const pins = await this.prisma.$queryRaw<MapPin[]>`
      SELECT id, lat, lng, price
      FROM   "Property"
      WHERE  "displayOnInternet" = true
        AND  status              = 'Active'
        AND  lat                 IS NOT NULL
        AND  lng                 IS NOT NULL
        AND  ST_Within(
               ST_SetSRID(ST_MakePoint(lng, lat), 4326),
               ST_MakeEnvelope(${west}, ${south}, ${east}, ${north}, 4326)
             )
      LIMIT  500
    `

    await this.redis.set(cacheKey, JSON.stringify(pins), MAP_PINS_TTL)
    return pins
  }

  // ─── Private helpers ─────────────────────────────────────────────────────

  /** Standard Prisma query — used when there is no bbox */
  private async prismaSearch(dto: SearchQueryDto, skip: number, limit: number): Promise<SearchResult> {
    const where = this.buildWhere(dto)
    const page = dto.page ?? 1

    const [data, total] = await Promise.all([
      this.prisma.property.findMany({
        where,
        include: { agent: true, office: true },
        orderBy: { listedAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.property.count({ where }),
    ])

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) }
  }

  /**
   * BE-302: Two-phase PostGIS bbox query.
   * Phase 1 — raw SQL with ST_MakeEnvelope gets the property IDs inside the
   *            viewport (fast spatial index scan).
   * Phase 2 — Prisma applies remaining filters against those IDs + returns
   *            full property rows with relations.
   */
  private async bboxSearch(dto: SearchQueryDto, skip: number, limit: number): Promise<SearchResult> {
    const coords = this.parseBbox(dto.bbox!)
    if (!coords) return { data: [], total: 0, page: dto.page ?? 1, limit, totalPages: 0 }

    const { west, south, east, north } = coords
    const page = dto.page ?? 1

    // Phase 1: spatial filter → IDs only
    const rows = await this.prisma.$queryRaw<{ id: string }[]>`
      SELECT id
      FROM   "Property"
      WHERE  lat IS NOT NULL
        AND  lng IS NOT NULL
        AND  ST_Within(
               ST_SetSRID(ST_MakePoint(lng, lat), 4326),
               ST_MakeEnvelope(${west}, ${south}, ${east}, ${north}, 4326)
             )
    `

    if (rows.length === 0) return { data: [], total: 0, page, limit, totalPages: 0 }

    const bboxIds = rows.map((r) => r.id)

    // Phase 2: Prisma query with all other filters + bbox ID constraint
    const where = this.buildWhere(dto)
    where.id = { in: bboxIds }

    const [data, total] = await Promise.all([
      this.prisma.property.findMany({
        where,
        include: { agent: true, office: true },
        orderBy: { listedAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.property.count({ where }),
    ])

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) }
  }

  /**
   * Build a `Prisma.PropertyWhereInput` from all filter params in the DTO.
   * bbox is intentionally excluded — handled separately by PostGIS.
   */
  private buildWhere(dto: SearchQueryDto): Prisma.PropertyWhereInput {
    const where: Prisma.PropertyWhereInput = {
      displayOnInternet: true,
      status: dto.status ?? 'Active',
    }

    if (dto.city) {
      where.city = { contains: dto.city, mode: 'insensitive' }
    }

    if (dto.province) {
      where.province = { contains: dto.province, mode: 'insensitive' }
    }

    if (dto.minPrice !== undefined || dto.maxPrice !== undefined) {
      where.price = {
        ...(dto.minPrice !== undefined ? { gte: dto.minPrice } : {}),
        ...(dto.maxPrice !== undefined ? { lte: dto.maxPrice } : {}),
      }
    }

    if (dto.beds !== undefined) {
      where.beds = { gte: dto.beds }
    }

    if (dto.baths !== undefined) {
      where.baths = { gte: dto.baths }
    }

    if (dto.minSqft !== undefined || dto.maxSqft !== undefined) {
      where.sqft = {
        ...(dto.minSqft !== undefined ? { gte: dto.minSqft } : {}),
        ...(dto.maxSqft !== undefined ? { lte: dto.maxSqft } : {}),
      }
    }

    if (dto.yearBuiltMin !== undefined) {
      where.yearBuilt = { gte: dto.yearBuiltMin }
    }

    if (dto.parkingMin !== undefined) {
      where.parkingTotal = { gte: dto.parkingMin }
    }

    if (dto.propertyType) {
      const types = dto.propertyType
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)
      if (types.length === 1) {
        where.propertySubType = types[0]
      } else if (types.length > 1) {
        where.propertySubType = { in: types }
      }
    }

    // Free-text — matched across key text columns
    if (dto.q) {
      where.OR = [
        { address: { contains: dto.q, mode: 'insensitive' } },
        { city: { contains: dto.q, mode: 'insensitive' } },
        { province: { contains: dto.q, mode: 'insensitive' } },
        { postalCode: { contains: dto.q, mode: 'insensitive' } },
        { description: { contains: dto.q, mode: 'insensitive' } },
      ]
    }

    return where
  }

  /** Parse `west,south,east,north` bbox string — returns null on bad input. */
  private parseBbox(bbox: string): { west: number; south: number; east: number; north: number } | null {
    const parts = bbox.split(',').map(Number)
    if (parts.length !== 4 || parts.some(isNaN)) {
      this.logger.warn(`Invalid bbox param: "${bbox}"`)
      return null
    }
    const [west, south, east, north] = parts
    return { west, south, east, north }
  }

  private hashQuery(obj: Record<string, unknown>): string {
    return createHash('md5').update(JSON.stringify(obj)).digest('hex')
  }
}
