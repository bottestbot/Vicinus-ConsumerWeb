import { ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Prisma } from '@prisma/client'
import { createClerkClient } from '@clerk/backend'
import { PrismaService } from '../../prisma/prisma.service'
import { EditorialService } from '../editorial/editorial.service'
import { DdfQueryService } from '../ddf-sync/ddf-query.service'
import { CreateSavedSearchDto } from '../search/dto/create-saved-search.dto'

// ─── Helpers ──────────────────────────────────────────────────────────────────

type ImageEntry = { url?: string; isPrimary?: boolean }

function getMainPhotoUrl(images: unknown): string | null {
  if (!Array.isArray(images) || images.length === 0) return null
  const primary = (images as ImageEntry[]).find((i) => i.isPrimary)
  return (primary?.url ?? (images[0] as ImageEntry).url) ?? null
}

/**
 * Shape consumed by the dashboard UI (`DashboardProperty` on the frontend).
 * Saved/visited rows only store a DDF ListingKey, so the full card is resolved
 * on read — first from the synced Property table, then a live DDF fallback.
 */
export interface DashboardProperty {
  id: string
  ddfListingKey: string
  status: string
  price: number | null
  beds: number | null
  baths: number | null
  sqft: number | null
  streetNumber: string | null
  streetName: string | null
  city: string | null
  province: string | null
  postalCode: string | null
  primaryPhotoUrl: string | null
  agentName: string | null
  brokerageName: string | null
  mlsNumber: string | null
}

// Fields pulled from the local Property table to build a dashboard card.
const DASHBOARD_PROPERTY_SELECT = {
  id: true,
  ddfListingKey: true,
  ddfListingId: true,
  status: true,
  price: true,
  beds: true,
  baths: true,
  sqft: true,
  streetNumber: true,
  streetName: true,
  city: true,
  province: true,
  postalCode: true,
  images: true,
  agent: { select: { fullName: true } },
  office: { select: { name: true } },
} satisfies Prisma.PropertySelect

type LocalPropertyRow = Prisma.PropertyGetPayload<{ select: typeof DASHBOARD_PROPERTY_SELECT }>

function localToDashboardProperty(p: LocalPropertyRow): DashboardProperty {
  return {
    id: p.ddfListingKey, // FE links to /properties/:id by ListingKey
    ddfListingKey: p.ddfListingKey,
    status: p.status,
    price: p.price,
    beds: p.beds,
    baths: p.baths,
    sqft: p.sqft,
    streetNumber: p.streetNumber,
    streetName: p.streetName,
    city: p.city,
    province: p.province,
    postalCode: p.postalCode,
    primaryPhotoUrl: getMainPhotoUrl(p.images),
    agentName: p.agent?.fullName ?? null,
    brokerageName: p.office?.name ?? null,
    mlsNumber: p.ddfListingId ?? p.ddfListingKey,
  }
}

function ddfToDashboardProperty(d: Record<string, unknown>): DashboardProperty {
  const agent = d.agent as { fullName?: string } | null
  const office = d.office as { name?: string } | null
  const key = String(d.ddfListingKey ?? d.id)
  return {
    id: key,
    ddfListingKey: key,
    status: (d.status as string) ?? 'Active',
    price: (d.price as number | null) ?? null,
    beds: (d.beds as number | null) ?? null,
    baths: (d.baths as number | null) ?? null,
    sqft: (d.sqft as number | null) ?? null,
    streetNumber: (d.streetNumber as string | null) ?? null,
    streetName: (d.streetName as string | null) ?? null,
    city: (d.city as string | null) ?? null,
    province: (d.province as string | null) ?? null,
    postalCode: (d.postalCode as string | null) ?? null,
    primaryPhotoUrl: getMainPhotoUrl(d.images),
    agentName: agent?.fullName ?? null,
    brokerageName: office?.name ?? null,
    mlsNumber: (d.ddfListingId as string | null) ?? key,
  }
}

// ─── Service ──────────────────────────────────────────────────────────────────

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name)

  constructor(
    private prisma: PrismaService,
    private editorial: EditorialService,
    private config: ConfigService,
    private ddfQuery: DdfQueryService,
  ) {}

  /**
   * Resolve a set of DDF ListingKeys into dashboard cards. Local synced rows are
   * preferred (fast); anything not yet synced falls back to a live DDF fetch.
   * Keys that can't be resolved are simply omitted.
   */
  private async resolveProperties(keys: string[]): Promise<Map<string, DashboardProperty>> {
    const map = new Map<string, DashboardProperty>()
    const unique = [...new Set(keys)]
    if (unique.length === 0) return map

    const localRows = await this.prisma.property.findMany({
      where: { ddfListingKey: { in: unique } },
      select: DASHBOARD_PROPERTY_SELECT,
    })
    for (const row of localRows) map.set(row.ddfListingKey, localToDashboardProperty(row))

    const missing = unique.filter((k) => !map.has(k))
    if (missing.length > 0) {
      const fetched = await Promise.all(missing.map((k) => this.ddfQuery.getListingByKey(k)))
      fetched.forEach((d, i) => {
        if (d) map.set(missing[i], ddfToDashboardProperty(d))
      })
    }
    return map
  }

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
    const existing = await this.prisma.user.findUnique({ where: { clerkId } })
    if (existing) return existing

    // JIT provisioning — user signed up via Clerk but webhook hasn't fired yet
    // (common in dev where localhost isn't reachable by Clerk's webhook service)
    this.logger.log(`JIT provisioning user ${clerkId}`)
    try {
      const clerk = createClerkClient({
        secretKey: this.config.get<string>('CLERK_SECRET_KEY') ?? '',
      })
      const clerkUser = await clerk.users.getUser(clerkId)
      const email = clerkUser.emailAddresses[0]?.emailAddress
      if (!email) throw new NotFoundException('User not found and no email on Clerk account')
      const fullName = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') || undefined
      return this.upsertFromClerk({
        clerkId,
        email,
        fullName,
        avatarUrl: clerkUser.imageUrl ?? undefined,
        role: (clerkUser.unsafeMetadata as { role?: string })?.role ?? 'buyer',
      })
    } catch (err) {
      this.logger.error(`JIT provisioning failed for ${clerkId}: ${(err as Error).message}`)
      throw new NotFoundException('User not found')
    }
  }

  // ─── Saved Properties (BE-601) ────────────────────────────────────────────

  async getSavedProperties(clerkId: string) {
    const user = await this.getMe(clerkId)
    const rows = await this.prisma.savedProperty.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    })
    const map = await this.resolveProperties(rows.map((r) => r.propertyId))
    return rows.flatMap((r) => {
      const property = map.get(r.propertyId)
      return property ? [{ id: r.id, propertyId: r.propertyId, createdAt: r.createdAt, property }] : []
    })
  }

  /** `listingKey` is the DDF ListingKey — stored as-is, no Property FK. */
  async saveProperty(clerkId: string, listingKey: string) {
    const user = await this.getMe(clerkId)
    return this.prisma.savedProperty.upsert({
      where: { userId_propertyId: { userId: user.id, propertyId: listingKey } },
      create: { userId: user.id, propertyId: listingKey },
      update: {},
    })
  }

  async unsaveProperty(clerkId: string, listingKey: string) {
    const user = await this.getMe(clerkId)
    await this.prisma.savedProperty.deleteMany({
      where: { userId: user.id, propertyId: listingKey },
    })
    return { success: true }
  }

  // ─── Visited Properties (BE-602) ─────────────────────────────────────────

  async getVisitedProperties(clerkId: string) {
    const user = await this.getMe(clerkId)
    const rows = await this.prisma.visitedProperty.findMany({
      where: { userId: user.id },
      orderBy: { visitedAt: 'desc' },
      take: 10,
    })
    const map = await this.resolveProperties(rows.map((r) => r.propertyId))
    return rows.flatMap((r) => {
      const property = map.get(r.propertyId)
      return property ? [{ id: r.id, propertyId: r.propertyId, visitedAt: r.visitedAt, property }] : []
    })
  }

  /** `listingKey` is the DDF ListingKey. De-dupes so each listing appears once. */
  async trackVisited(clerkId: string, listingKey: string) {
    const user = await this.getMe(clerkId)
    await this.prisma.visitedProperty.deleteMany({
      where: { userId: user.id, propertyId: listingKey },
    })
    return this.prisma.visitedProperty.create({
      data: { userId: user.id, propertyId: listingKey },
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

  // ─── Onboarding ──────────────────────────────────────────────────────────

  async ping(clerkId: string, sessionId?: string) {
    const user = await this.getMe(clerkId)

    // `loginCount` is a login-SESSION counter, not a page-load counter. Bump it
    // only when this ping comes from a session we haven't seen before — i.e. the
    // incoming Clerk sessionId differs from the stored `lastSessionId`. A null
    // `lastSessionId` (brand-new user / pre-migration existing user) counts as a
    // new session. Repeat pings within the same session (reloads, route changes)
    // leave the count untouched.
    const isNewSession = !user.lastSessionId || user.lastSessionId !== sessionId
    const loginCount = isNewSession ? user.loginCount + 1 : user.loginCount

    const updated =
      isNewSession
        ? await this.prisma.user.update({
            where: { id: user.id },
            data: { loginCount, lastSessionId: sessionId ?? null },
          })
        : user

    // Re-prompt cadence: show on sessions 1, 6, 11, 16… until completed.
    const showOnboarding = !updated.onboardingCompleted && loginCount % 5 === 1
    return {
      loginCount,
      onboardingCompleted: updated.onboardingCompleted,
      showOnboarding,
    }
  }

  async updateOnboarding(clerkId: string, data: { stepData?: Record<string, unknown>; completed?: boolean }) {
    const user = await this.getMe(clerkId)
    const existing = (user.onboardingData as Record<string, unknown>) ?? {}
    const merged = data.stepData ? { ...existing, ...data.stepData } : existing
    return this.prisma.user.update({
      where: { id: user.id },
      data: {
        onboardingData: merged as Prisma.InputJsonValue,
        ...(data.completed ? { onboardingCompleted: true } : {}),
      },
    })
  }

  // ─── Dashboard (BE-604) ──────────────────────────────────────────────────

  async getDashboard(clerkId: string) {
    const user = await this.getMe(clerkId)

    const [savedRows, visitedRows, editorial] = await Promise.all([
      this.prisma.savedProperty.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        take: 6,
      }),
      this.prisma.visitedProperty.findMany({
        where: { userId: user.id },
        orderBy: { visitedAt: 'desc' },
        take: 6,
      }),
      this.editorial.findAll(),
    ])

    const map = await this.resolveProperties([
      ...savedRows.map((r) => r.propertyId),
      ...visitedRows.map((r) => r.propertyId),
    ])

    const saved = savedRows.flatMap((r) => {
      const property = map.get(r.propertyId)
      return property ? [{ id: r.id, propertyId: r.propertyId, createdAt: r.createdAt, property }] : []
    })
    const visited = visitedRows.flatMap((r) => {
      const property = map.get(r.propertyId)
      return property ? [{ id: r.id, propertyId: r.propertyId, visitedAt: r.visitedAt, property }] : []
    })

    return {
      user: {
        id: user.id,
        clerkId: user.clerkId,
        email: user.email,
        fullName: user.fullName,
        avatarUrl: user.avatarUrl,
        role: user.role,
      },
      saved,
      visited,
      editorial,
    }
  }
}
