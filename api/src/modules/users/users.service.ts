import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'

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
