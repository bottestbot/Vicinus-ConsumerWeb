import apiClient from './client'
import type { OpenHouseProperty, PropertyDetail, PropertyFactsDetails } from '@/types/property'
import { propertyTypeLabel } from '@/types/search'

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
  /** DDF ListingURL — deep-links the "Powered by REALTOR.ca" badge (Task #4). */
  realtorUrl?: string | null
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
  virtualTourUrl?: string | null
  youtubeUrl?: string | null
  listedAt?: string | null
  agent?: { fullName?: string | null } | null
  office?: { name?: string | null } | null
  details?: PropertyFactsDetails | null
}

function mapImages(images: ApiListingImage[] | null | undefined): string[] {
  if (!Array.isArray(images)) return []
  const seen = new Set<string>()
  return images
    .filter((m) => !!m.url)
    .sort((a, b) => {
      // primary first, then by order
      if (a.isPrimary && !b.isPrimary) return -1
      if (!a.isPrimary && b.isPrimary) return 1
      return (a.order ?? 0) - (b.order ?? 0)
    })
    .map((m) => m.url as string)
    // DDF sometimes repeats the same media URL under multiple order slots —
    // dedupe so the gallery grid doesn't show the same photo twice.
    .filter((url) => (seen.has(url) ? false : seen.add(url)))
}

function daysSince(iso: string | null | undefined): number {
  if (!iso) return 0
  const t = new Date(iso).getTime()
  if (Number.isNaN(t)) return 0
  return Math.max(0, Math.floor((Date.now() - t) / 86_400_000))
}

/** DDF remarks sometimes end with an internal id like "(id:66285)" — strip it
 *  before showing customer-facing description text. */
function cleanDescription(desc: string | null | undefined): string | undefined {
  if (!desc) return undefined
  return desc.replace(/\s*\(id:\d+\)\s*$/i, '').trim() || undefined
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
    // Prefer StructureType (real dwelling form) over PropertySubType, which
    // files condos/townhouses all as "Single Family". Same map as the filter.
    propertyType: propertyTypeLabel(l.details?.exterior?.structureType, l.propertySubType),
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
    realtorUrl: l.realtorUrl ?? null,
    yearBuilt: l.yearBuilt ?? undefined,
    parking: l.parkingTotal ?? undefined,
    stories: l.stories ?? undefined,
    description: cleanDescription(l.description),
    pricePerSqft: price > 0 && sqft > 0 ? Math.round(price / sqft) : undefined,
    details: l.details ?? undefined,
    virtualTourUrl: l.virtualTourUrl ?? undefined,
    youtubeUrl: l.youtubeUrl ?? undefined,
  }
}

/**
 * Fetch full detail for a live DDF listing by its key (the `id` returned by
 * search). Returns null when the listing genuinely isn't found (404) so the
 * caller renders the not-found UI.
 *
 * The remote API (Railway) can be slow to respond on a cold instance, which
 * previously surfaced as an intermittent "page couldn't load" that a manual
 * reload fixed (QA-07). We now bound each attempt with a timeout and retry once
 * on a transient failure (network error / 5xx) before giving up, so navigation
 * renders reliably on the first try.
 */
export async function getPropertyDetail(id: string): Promise<PropertyDetail | null> {
  const url = `${API_BASE}/search/listing/${encodeURIComponent(id)}`

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch(url, {
        next: { revalidate: 300 },
        signal: AbortSignal.timeout(8000),
      })
      // 404 = genuinely not a live listing; don't retry, fall back to not-found.
      if (res.status === 404) return null
      // Transient upstream failure — retry once before giving up.
      if (!res.ok) {
        if (attempt === 0) continue
        return null
      }
      const data = (await res.json()) as ApiListing
      if (!data || !data.id) return null
      return toPropertyDetail(data)
    } catch {
      // Network error / timeout — retry once, then fall back.
      if (attempt === 0) continue
      return null
    }
  }
  return null
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
  // DDF attribution — the homepage renders live listing data, so each card
  // must carry the same agent / brokerage / MLS® / REALTOR.ca line as every
  // other listing surface.
  realtorUrl?: string | null
  agentName?: string | null
  brokerageName?: string | null
  mlsNumber?: string | null
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
  /** Unscoped whole-city active listing count — informational only ("N active in {city}"), not the comp basis. */
  totalActiveListingsInCity: number
  /** Count of comps actually used for medianPrice/medianPricePerSqft/pricePosition after
   *  cohort scoping (same city + property subtype + price/sqft band). */
  compSampleSize: number
  /** True when compSampleSize is below the minimum reliable sample size — explains why
   *  pricePosition/medianPrice/medianPricePerSqft/medianDaysOnMarket are null, distinct
   *  from missingListedDate (which explains a null demandLevel). */
  insufficientComps: boolean
  /** True when the subject listing has no listedAt/OriginalEntryTimestamp from DDF —
   *  explains a null daysOnMarket/demandLevel even when comps are otherwise sufficient. */
  missingListedDate: boolean
  /** Saves on the subject listing in the trailing 14 days. Null until enough data exists. */
  saveVelocity: number | null
  /** Average trailing-14-day saves across the comp cohort, for comparison. */
  cohortAvgSaveVelocity: number | null
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
      openHouseKey: String(oh.openHouseKey ?? ''),
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
