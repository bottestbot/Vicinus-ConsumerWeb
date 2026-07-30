import { Injectable } from '@nestjs/common'
import { AlertType, Prisma } from '@prisma/client'
import { PrismaService } from '../../prisma/prisma.service'
import {
  UsersService,
  DASHBOARD_PROPERTY_SELECT,
  localToDashboardProperty,
  type DashboardProperty,
} from '../users/users.service'
import type {
  BriefFacts,
  BriefHighlight,
  BriefHighlightKind,
} from './brief.types'

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000
const MAX_HIGHLIGHTS = 3

const KIND_BY_ALERT_TYPE: Record<AlertType, BriefHighlightKind> = {
  [AlertType.PRICE_DROP]: 'price_drop',
  [AlertType.NEW_LISTING]: 'new_listing',
  [AlertType.STATUS_CHANGE]: 'status_change',
  [AlertType.OPEN_HOUSE]: 'open_house',
}

type AlertRow = Prisma.AlertGetPayload<{
  include: { property: { select: typeof DASHBOARD_PROPERTY_SELECT } }
}>

function money(n: number | null | undefined): string | null {
  return typeof n === 'number' && Number.isFinite(n)
    ? `$${Math.round(n).toLocaleString('en-CA')}`
    : null
}

function formatOpenHouseDate(value: unknown): string | null {
  if (!value) return null
  const d = new Date(value as string)
  if (Number.isNaN(d.getTime())) return null
  return d.toLocaleDateString('en-CA', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

// Compass directionals stay upper-cased ("W", "NW") rather than being
// title-cased into "W"/"Nw".
const DIRECTIONALS = new Set(['N', 'S', 'E', 'W', 'NE', 'NW', 'SE', 'SW'])

/** Tidy DDF's ALL-CAPS street text for display: "456 W 11TH AVENUE, Vancouver"
 *  → "456 W 11th Avenue, Vancouver"; "2986 ALBION" → "2986 Albion". Only
 *  re-cases fully-upper-case words (so ordinals like "63RD" → "63rd" and
 *  "ROBINSON" → "Robinson"), leaves already-mixed-case text ("Vancouver") alone,
 *  and preserves compass directionals. */
function tidyAddress(value: string): string {
  return value
    .split(/\s+/)
    .map((word) => {
      const upper = word.toUpperCase()
      if (DIRECTIONALS.has(upper)) return upper
      if (word === upper && /[A-Z]/.test(word)) {
        return word.charAt(0) + word.slice(1).toLowerCase()
      }
      return word
    })
    .join(' ')
}

/** `456 W 11th Avenue, Vancouver` from a resolved card, falling back to payload. */
function subLabelFor(
  property: DashboardProperty | null,
  payloadAddress: unknown,
  payloadCity?: unknown,
): string | null {
  let result: string | null = null
  if (property) {
    const street = [property.streetNumber, property.streetName]
      .filter(Boolean)
      .join(' ')
      .trim()
    const parts = [street || null, property.city].filter(Boolean)
    if (parts.length > 0) result = parts.join(', ')
  }
  if (!result) {
    const addr = typeof payloadAddress === 'string' ? payloadAddress.trim() : ''
    const city = typeof payloadCity === 'string' ? payloadCity.trim() : ''
    const parts = [addr || null, city && !addr.includes(city) ? city : null].filter(Boolean)
    if (parts.length > 0) result = parts.join(', ')
  }
  return result ? tidyAddress(result) : null
}

@Injectable()
export class BriefFactsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly users: UsersService,
  ) {}

  /**
   * BRIEF-05 — the deterministic core. NO AI. Pulls alerts from a fixed rolling
   * 7-day window, joins saves/searches/profile, ranks by salience and emits a
   * typed facts object. Every figure the page renders is computed here.
   *
   * The window is deliberately a trailing 7 days, NOT a "since your last visit"
   * cursor: a cursor emptied the card the moment you viewed it (and advanced on
   * the CTA-click "seen" write), so an active user saw a blank brief. A fixed
   * week keeps the card reflecting "what moved this week" regardless of views.
   */
  async buildBriefFacts(clerkId: string): Promise<BriefFacts> {
    const user = await this.users.getMe(clerkId)
    const now = new Date()
    const since = new Date(now.getTime() - SEVEN_DAYS_MS)

    const alerts = await this.prisma.alert.findMany({
      where: { userId: user.id, createdAt: { gt: since } },
      include: { property: { select: DASHBOARD_PROPERTY_SELECT } },
      orderBy: { createdAt: 'desc' },
    })

    const emptyCounts: Record<BriefHighlightKind, number> = {
      price_drop: 0,
      new_listing: 0,
      status_change: 0,
      open_house: 0,
    }

    // No alerts in the window → nothing actually moved on anything this user
    // tracks, so there is no brief. This previously fell back to a
    // "forward-looking" variant (BRIEF-11) that pulled the soonest open houses
    // and newest listings platform-wide; with no preferred neighbourhoods to
    // filter on that surfaced rural Alberta to a Vancouver user and presented
    // it as their own. A brief is a report on real activity — when there is
    // none, say nothing and let the section empty states do their job.
    if (alerts.length === 0) {
      return {
        generatedAt: now.toISOString(),
        since: since.toISOString(),
        isEmpty: true,
        alertCount: 0,
        counts: emptyCounts,
        highlights: [],
        latestAlertId: null,
        focusNeighbourhoods: [],
      }
    }

    // Context needed to score salience.
    const savedRows = await this.prisma.savedProperty.findMany({
      where: { userId: user.id },
      select: { propertyId: true },
    })
    const savedKeys = new Set(savedRows.map((r) => r.propertyId))

    const counts = { ...emptyCounts }
    const scored = alerts.map((alert) => {
      const kind = KIND_BY_ALERT_TYPE[alert.type]
      counts[kind] += 1
      return {
        highlight: this.highlightFromAlert(alert, kind),
        salience: this.salienceFor(alert, kind, savedKeys),
        createdAt: alert.createdAt.getTime(),
      }
    })

    scored.sort((a, b) =>
      b.salience !== a.salience ? b.salience - a.salience : b.createdAt - a.createdAt,
    )

    return {
      generatedAt: now.toISOString(),
      since: since.toISOString(),
      isEmpty: false,
      alertCount: alerts.length,
      counts,
      highlights: scored.slice(0, MAX_HIGHLIGHTS).map((s) => s.highlight),
      latestAlertId: alerts[0].id,
      focusNeighbourhoods: [],
    }
  }

  // ─── Salience ranking (BRIEF-05) ──────────────────────────────────────────
  // price drop on a SAVED property > new listing matching a SAVED SEARCH >
  // new listing matching PROFILE neighbourhoods > status change.
  private salienceFor(
    alert: AlertRow,
    kind: BriefHighlightKind,
    savedKeys: Set<string>,
  ): number {
    const payload = (alert.payload as Record<string, unknown>) ?? {}
    const listingKey =
      (payload.listingKey as string | undefined) ?? alert.property?.ddfListingKey ?? null
    const isSaved = listingKey !== null && savedKeys.has(listingKey)
    const matchedSearch = !!payload.matchedSearchId

    switch (kind) {
      case 'price_drop':
        return isSaved ? 100 : 62
      case 'new_listing':
        // A saved-search match outranks a bare profile/new listing.
        return matchedSearch ? 80 : isSaved ? 70 : 50
      case 'open_house':
        return isSaved ? 66 : 46
      case 'status_change':
        return isSaved ? 40 : 30
    }
  }

  private highlightFromAlert(alert: AlertRow, kind: BriefHighlightKind): BriefHighlight {
    const payload = (alert.payload as Record<string, unknown>) ?? {}
    const property = alert.property ? localToDashboardProperty(alert.property) : null
    // BRIEF-08: route by DDF ListingKey, NEVER the local cuid.
    const listingKey =
      (payload.listingKey as string | undefined) ?? property?.ddfListingKey ?? null
    const href = listingKey ? `/properties/${listingKey}` : '/dashboard'
    const subLabel = subLabelFor(property, payload.address, payload.city)

    return {
      id: alert.id,
      kind,
      label: this.labelFor(kind, payload, property),
      subLabel,
      href,
      listingKey,
    }
  }

  private labelFor(
    kind: BriefHighlightKind,
    payload: Record<string, unknown>,
    property: DashboardProperty | null,
  ): string {
    switch (kind) {
      case 'price_drop': {
        let drop = payload.dropAmount as number | undefined
        if ((drop === undefined || drop === null) &&
            typeof payload.previousPrice === 'number' &&
            typeof payload.newPrice === 'number') {
          drop = payload.previousPrice - payload.newPrice
        }
        const amt = money(typeof drop === 'number' ? Math.abs(drop) : null)
        return amt ? `${amt} price drop` : 'Price drop'
      }
      case 'new_listing': {
        const price = money((payload.price as number | undefined) ?? property?.price ?? null)
        return price ? `New listing at ${price}` : 'New listing'
      }
      case 'status_change': {
        const status = (payload.newStatus as string | undefined) ?? property?.status ?? null
        return status ? `Now ${status}` : 'Status changed'
      }
      case 'open_house': {
        const when = formatOpenHouseDate(payload.openHouseDate)
        return when ? `Open house ${when}` : 'Open house scheduled'
      }
    }
  }
}
