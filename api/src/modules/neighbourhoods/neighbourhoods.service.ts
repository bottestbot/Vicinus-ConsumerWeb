import { Injectable, NotFoundException } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { PrismaService } from '../../prisma/prisma.service'
import { RedisService } from '../../common/redis/redis.service'

const NEIGHBOURHOOD_TTL = 30 * 60

@Injectable()
export class NeighbourhoodsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
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

    const properties = await this.prisma.property.findMany({
      where: {
        city: neighbourhood.city ?? undefined,
        status: 'Active',
        displayOnInternet: true,
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

  // ── private helpers ──────────────────────────────────────────────────────

  private async requireBySlug(slug: string) {
    const row = await this.prisma.neighbourhood.findUnique({
      where: { slug },
      select: { id: true, city: true, province: true },
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
  heroImageUrl: null
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
}): NeighbourhoodSummary {
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
    heroImageUrl: null,
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
