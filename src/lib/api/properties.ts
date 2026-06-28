import apiClient from './client'
import type { OpenHouseProperty, PropertyDetail, PropertyFactsDetails } from '@/types/property'

export const getProperty = (id: string) => apiClient.get(`/properties/${id}`)
export const getProperties = (params?: Record<string, unknown>) => apiClient.get('/properties', { params })

// ─── AI Property Summary ──────────────────────────────────────────────────────

export interface PropertySummarySection {
  summary: string
  bullets?: string[]
  chips: string[]
}

export interface PropertySummaryData {
  propertyOverview: PropertySummarySection
  lifestyleFit: PropertySummarySection
}

export async function getPropertyAiSummary(id: string): Promise<PropertySummaryData | null> {
  try {
    const res = await fetch(`${API_BASE}/ai/property-summary/${encodeURIComponent(id)}`, {
      next: { revalidate: 14400 }, // 4 hours — matches BE cache TTL
    })
    if (!res.ok) return null
    return (await res.json()) as PropertySummaryData
  } catch {
    return null
  }
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001'

// ─── Live DDF listing detail ──────────────────────────────────────────────────

interface ApiListingImage {
  url?: string | null
  order?: number | null
  isPrimary?: boolean | null
}

interface ApiListing {
  id: string
  ddfListingId?: string | null
  status?: string | null
  price?: number | null
  leaseAmount?: number | null
  propertySubType?: string | null
  beds?: number | null
  baths?: number | null
  sqft?: number | null
  yearBuilt?: number | null
  parkingTotal?: number | null
  stories?: number | null
  address?: string | null
  city?: string | null
  province?: string | null
  postalCode?: string | null
  lat?: number | null
  lng?: number | null
  description?: string | null
  images?: ApiListingImage[] | null
  listedAt?: string | null
  agent?: { fullName?: string | null } | null
  office?: { name?: string | null } | null
  details?: PropertyFactsDetails | null
}

function mapImages(images: ApiListingImage[] | null | undefined): string[] {
  if (!Array.isArray(images)) return []
  return images
    .filter((m) => !!m.url)
    .sort((a, b) => {
      // primary first, then by order
      if (a.isPrimary && !b.isPrimary) return -1
      if (!a.isPrimary && b.isPrimary) return 1
      return (a.order ?? 0) - (b.order ?? 0)
    })
    .map((m) => m.url as string)
}

function daysSince(iso: string | null | undefined): number {
  if (!iso) return 0
  const t = new Date(iso).getTime()
  if (Number.isNaN(t)) return 0
  return Math.max(0, Math.floor((Date.now() - t) / 86_400_000))
}

function toPropertyDetail(l: ApiListing): PropertyDetail {
  // Rentals carry leaseAmount instead of price — fall back so rent shows.
  const price = l.price ?? l.leaseAmount ?? 0
  const sqft = l.sqft ?? 0
  const allowedStatus = ['Active', 'Sold', 'Coming Soon', 'Open House'] as const
  const status = (allowedStatus.includes(l.status as never) ? l.status : 'Active') as PropertyDetail['status']

  return {
    id: String(l.id),
    address: l.address ?? '',
    city: l.city ?? '',
    province: l.province ?? '',
    postalCode: l.postalCode ?? '',
    price,
    beds: l.beds ?? 0,
    baths: l.baths ?? 0,
    sqft,
    propertyType: l.propertySubType ?? '',
    status,
    daysOnMarket: daysSince(l.listedAt),
    listingType: l.leaseAmount != null ? 'For Rent' : 'For Sale',
    latitude: l.lat ?? 0,
    longitude: l.lng ?? 0,
    images: mapImages(l.images),
    agentName: l.agent?.fullName ?? '',
    agentTitle: 'REALTOR®',
    brokerageName: l.office?.name ?? '',
    mlsNumber: l.ddfListingId ?? String(l.id),
    yearBuilt: l.yearBuilt ?? undefined,
    parking: l.parkingTotal ?? undefined,
    stories: l.stories ?? undefined,
    description: l.description ?? undefined,
    pricePerSqft: price > 0 && sqft > 0 ? Math.round(price / sqft) : undefined,
    details: l.details ?? undefined,
  }
}

/**
 * Fetch full detail for a live DDF listing by its key (the `id` returned by
 * search). Returns null when the listing isn't a DDF key or is unavailable —
 * the caller can then fall back to mock/demo data.
 */
export async function getPropertyDetail(id: string): Promise<PropertyDetail | null> {
  try {
    const res = await fetch(`${API_BASE}/search/listing/${encodeURIComponent(id)}`, {
      next: { revalidate: 300 },
    })
    if (!res.ok) return null
    const data = (await res.json()) as ApiListing
    if (!data || !data.id) return null
    return toPropertyDetail(data)
  } catch {
    return null
  }
}

// ─── Featured highlights (BE-H) ───────────────────────────────────────────────

export interface FeaturedProperty {
  id: string
  name: string
  location: string
  price: number | null
  beds: number | null
  baths: number | null
  sqft: number | null
  image: string | null
  badge: string
  href: string
}

/** Real curated highlight listings for the landing page. Returns [] on miss. */
export async function getFeaturedProperties(): Promise<FeaturedProperty[]> {
  try {
    const res = await fetch(`${API_BASE}/properties/featured`, { next: { revalidate: 600 }, signal: AbortSignal.timeout(5000) })
    if (!res.ok) return []
    const data = (await res.json()) as FeaturedProperty[]
    return Array.isArray(data) ? data : []
  } catch {
    return []
  }
}

// ─── Market context (BE-G) ────────────────────────────────────────────────────

export interface MarketContextData {
  daysOnMarket: number | null
  medianDaysOnMarket: number | null
  price: number | null
  pricePerSqft: number | null
  medianPrice: number | null
  medianPricePerSqft: number | null
  pricePosition: 'above_market' | 'at_market' | 'below_market' | null
  demandLevel: 'high' | 'medium' | 'low' | null
  totalActiveListingsInCity: number
}

/**
 * Real market context for a listing — median price/$ per sqft/days-on-market
 * computed from live active comparables in the same city. Returns null on miss
 * so the component can fall back to subject-only display.
 */
export async function getMarketContext(id: string): Promise<MarketContextData | null> {
  try {
    const res = await fetch(`${API_BASE}/properties/${encodeURIComponent(id)}/market-context`, {
      next: { revalidate: 300 },
    })
    if (!res.ok) return null
    return (await res.json()) as MarketContextData
  } catch {
    return null
  }
}

// ─── Open houses ──────────────────────────────────────────────────────────────

export interface OpenHouseSlot {
  id: string
  date: string | null
  startTime: string | null
  endTime: string | null
  type: string | null
  remarks: string | null
  livestreamUrl: string | null
}

/** Upcoming open houses for a live DDF listing (empty array if none). */
export async function getListingOpenHouses(id: string): Promise<OpenHouseSlot[]> {
  try {
    const res = await fetch(`${API_BASE}/search/listing/${encodeURIComponent(id)}/open-houses`, {
      next: { revalidate: 300 },
    })
    if (!res.ok) return []
    const data = (await res.json()) as OpenHouseSlot[]
    return Array.isArray(data) ? data : []
  } catch {
    return []
  }
}

// ─── Nearby open houses ─────────────────────────────────────────────────────────

/**
 * Open houses at nearby listings for a live DDF listing (empty array if none).
 * Shape matches OpenHouseProperty so the NearbyOpenHouses carousel can consume
 * it directly. Defensive: returns [] on error and coerces missing fields.
 */
export async function getNearbyOpenHouses(id: string): Promise<OpenHouseProperty[]> {
  try {
    const res = await fetch(
      `${API_BASE}/search/listing/${encodeURIComponent(id)}/nearby-open-houses`,
      { next: { revalidate: 300 } },
    )
    if (!res.ok) return []
    const data = (await res.json()) as Partial<OpenHouseProperty>[]
    if (!Array.isArray(data)) return []
    return data.map((oh) => ({
      id: String(oh.id ?? ''),
      address: oh.address ?? '',
      city: oh.city ?? '',
      province: oh.province ?? '',
      price: oh.price ?? 0,
      beds: oh.beds ?? 0,
      baths: oh.baths ?? 0,
      sqft: oh.sqft ?? 0,
      imageUrl: oh.imageUrl ?? '',
      openHouseDate: oh.openHouseDate ?? '',
      openHouseStartTime: oh.openHouseStartTime ?? '',
      openHouseEndTime: oh.openHouseEndTime ?? '',
      agentName: oh.agentName ?? '',
      brokerageName: oh.brokerageName ?? '',
    }))
  } catch {
    return []
  }
}
