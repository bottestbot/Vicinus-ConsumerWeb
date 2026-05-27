import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { CreateSavedSearchDto } from '../search/dto/create-saved-search.dto'

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

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

  // ─── Saved Properties ────────────────────────────────────────────────────

  async getSavedProperties(clerkId: string) {
    const user = await this.getMe(clerkId)
    return this.prisma.savedProperty.findMany({
      where: { userId: user.id },
      include: { property: true },
      orderBy: { createdAt: 'desc' },
    })
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

  // ─── Visited Properties ──────────────────────────────────────────────────

  async getVisitedProperties(clerkId: string) {
    const user = await this.getMe(clerkId)
    return this.prisma.visitedProperty.findMany({
      where: { userId: user.id },
      include: { property: true },
      orderBy: { visitedAt: 'desc' },
      take: 20,
    })
  }

  async trackVisited(clerkId: string, propertyId: string) {
    const user = await this.getMe(clerkId)
    return this.prisma.visitedProperty.create({
      data: { userId: user.id, propertyId },
    })
  }

  // ─── Saved Searches (BE-306) ─────────────────────────────────────────────

  /**
   * List all saved searches for the authenticated user, newest first.
   */
  async getSavedSearches(clerkId: string) {
    const user = await this.getMe(clerkId)
    return this.prisma.savedSearch.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    })
  }

  /**
   * Persist a new saved search (name + serialised filter JSON).
   */
  async createSavedSearch(clerkId: string, dto: CreateSavedSearchDto) {
    const user = await this.getMe(clerkId)
    return this.prisma.savedSearch.create({
      data: {
        userId: user.id,
        name: dto.name ?? null,
        filters: dto.filters,
      },
    })
  }

  /**
   * Delete a saved search — verifies ownership before deleting.
   */
  async deleteSavedSearch(clerkId: string, searchId: string) {
    const user = await this.getMe(clerkId)
    const saved = await this.prisma.savedSearch.findUnique({ where: { id: searchId } })
    if (!saved) throw new NotFoundException('Saved search not found')
    if (saved.userId !== user.id) throw new ForbiddenException()
    return this.prisma.savedSearch.delete({ where: { id: searchId } })
  }

  // ─── Dashboard aggregate ─────────────────────────────────────────────────

  async getDashboard(clerkId: string) {
    const user = await this.getMe(clerkId)
    const [saved, visited, editorial] = await Promise.all([
      this.prisma.savedProperty.findMany({
        where: { userId: user.id },
        include: { property: true },
        orderBy: { createdAt: 'desc' },
        take: 6,
      }),
      this.prisma.visitedProperty.findMany({
        where: { userId: user.id },
        include: { property: true },
        orderBy: { visitedAt: 'desc' },
        take: 6,
      }),
      this.prisma.editorialCuration.findMany({
        orderBy: { publishedAt: 'desc' },
        take: 4,
      }),
    ])
    return { user, saved, visited, editorial }
  }
}
