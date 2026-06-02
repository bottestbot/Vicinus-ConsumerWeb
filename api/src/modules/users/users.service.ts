import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { PrismaService } from '../../prisma/prisma.service'
import { EditorialService } from '../editorial/editorial.service'
import { CreateSavedSearchDto } from '../search/dto/create-saved-search.dto'

// ─── Helpers ──────────────────────────────────────────────────────────────────

type ImageEntry = { url?: string; isPrimary?: boolean }

function getMainPhotoUrl(images: unknown): string | null {
  if (!Array.isArray(images) || images.length === 0) return null
  const primary = (images as ImageEntry[]).find((i) => i.isPrimary)
  return (primary?.url ?? (images[0] as ImageEntry).url) ?? null
}

type PropertyRow = {
  id: string
  ddfListingKey: string
  address: string | null
  city: string | null
  price: number | null
  beds: number | null
  baths: number | null
  images: unknown
}

function mapPropertyCard(p: PropertyRow, savedAt: Date | undefined) {
  return {
    id: p.id,
    listingKey: p.ddfListingKey,
    address: p.address,
    city: p.city,
    listPrice: p.price,
    bedrooms: p.beds,
    bathrooms: p.baths,
    mainPhotoUrl: getMainPhotoUrl(p.images),
    savedAt: savedAt ?? null,
  }
}

// ─── Service ──────────────────────────────────────────────────────────────────

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private editorial: EditorialService,
  ) {}

  async findByClerkId(clerkId: string) {
    return this.prisma.user.findUnique({ where: { clerkId } })
  }

  async upsertFromClerk(data: { clerkId: string; email: string; fullName?: string; avatarUrl?: string; role?: string }) {
    return this.prisma.user.upsert({
      where: { clerkId: data.clerkId },
      create: {
        clerkId: data.clerkId,
        email: data.email,
        fullName: data.fullName,
        avatarUrl: data.avatarUrl,
        role: data.role ?? 'buyer',
      },
      update: {
        email: data.email,
        fullName: data.fullName,
        avatarUrl: data.avatarUrl,
      },
    })
  }

  async getMe(clerkId: string) {
    const user = await this.prisma.user.findUnique({ where: { clerkId } })
    if (!user) throw new NotFoundException('User not found')
    return user
  }

  // ─── Saved Properties (BE-601) ────────────────────────────────────────────

  async getSavedProperties(clerkId: string) {
    const user = await this.getMe(clerkId)
    const rows = await this.prisma.savedProperty.findMany({
      where: { userId: user.id },
      include: {
        property: {
          select: { id: true, ddfListingKey: true, address: true, city: true, price: true, beds: true, baths: true, images: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
    return rows.map((r) => mapPropertyCard(r.property, r.createdAt))
  }

  async saveProperty(clerkId: string, propertyId: string) {
    const user = await this.getMe(clerkId)
    return this.prisma.savedProperty.upsert({
      where: { userId_propertyId: { userId: user.id, propertyId } },
      create: { userId: user.id, propertyId },
      update: {},
    })
  }

  async unsaveProperty(clerkId: string, propertyId: string) {
    const user = await this.getMe(clerkId)
    return this.prisma.savedProperty.delete({
      where: { userId_propertyId: { userId: user.id, propertyId } },
    })
  }

  // ─── Visited Properties (BE-602) ─────────────────────────────────────────

  async getVisitedProperties(clerkId: string) {
    const user = await this.getMe(clerkId)
    const rows = await this.prisma.visitedProperty.findMany({
      where: { userId: user.id },
      include: {
        property: {
          select: { id: true, ddfListingKey: true, address: true, city: true, price: true, beds: true, baths: true, images: true },
        },
      },
      orderBy: { visitedAt: 'desc' },
      take: 10,
    })
    return rows.map((r) => mapPropertyCard(r.property, r.visitedAt))
  }

  async trackVisited(clerkId: string, propertyId: string) {
    const user = await this.getMe(clerkId)
    return this.prisma.visitedProperty.create({
      data: { userId: user.id, propertyId },
    })
  }

  // ─── Saved Searches (BE-306) ─────────────────────────────────────────────

  async getSavedSearches(clerkId: string) {
    const user = await this.getMe(clerkId)
    return this.prisma.savedSearch.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    })
  }

  async createSavedSearch(clerkId: string, dto: CreateSavedSearchDto) {
    const user = await this.getMe(clerkId)
    return this.prisma.savedSearch.create({
      data: {
        userId: user.id,
        name: dto.name ?? null,
        filters: dto.filters as Prisma.InputJsonValue,
      },
    })
  }

  async deleteSavedSearch(clerkId: string, searchId: string) {
    const user = await this.getMe(clerkId)
    const saved = await this.prisma.savedSearch.findUnique({ where: { id: searchId } })
    if (!saved) throw new NotFoundException('Saved search not found')
    if (saved.userId !== user.id) throw new ForbiddenException()
    return this.prisma.savedSearch.delete({ where: { id: searchId } })
  }

  // ─── Dashboard (BE-604) ──────────────────────────────────────────────────

  async getDashboard(clerkId: string) {
    const user = await this.getMe(clerkId)

    const propertySelect = {
      id: true,
      ddfListingKey: true,
      address: true,
      city: true,
      price: true,
      beds: true,
      baths: true,
      images: true,
    }

    const [savedRows, visitedRows, editorial] = await Promise.all([
      this.prisma.savedProperty.findMany({
        where: { userId: user.id },
        include: { property: { select: propertySelect } },
        orderBy: { createdAt: 'desc' },
        take: 6,
      }),
      this.prisma.visitedProperty.findMany({
        where: { userId: user.id },
        include: { property: { select: propertySelect } },
        orderBy: { visitedAt: 'desc' },
        take: 6,
      }),
      this.editorial.findAll(),
    ])

    const saved = savedRows.map((r) => mapPropertyCard(r.property, r.createdAt))
    const visited = visitedRows.map((r) => mapPropertyCard(r.property, r.visitedAt))

    // Recommended: first saved property, or first property in DB
    let recommended: ReturnType<typeof mapPropertyCard> | null = saved[0] ?? null
    if (!recommended) {
      const firstProp = await this.prisma.property.findFirst({
        select: propertySelect,
        orderBy: { createdAt: 'asc' },
      })
      if (firstProp) recommended = mapPropertyCard(firstProp, undefined)
    }

    const [firstName, ...rest] = (user.fullName ?? '').split(' ')
    const lastName = rest.join(' ')

    return {
      user: { firstName: firstName ?? '', lastName, email: user.email },
      saved,
      visited,
      editorial,
      recommended,
    }
  }
}
