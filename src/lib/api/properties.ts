import apiClient from './client'
import type { PropertyDetail } from '@/types/property'

export const getProperty = (id: string) => apiClient.get(`/properties/${id}`)
export const getProperties = (params?: Record<string, unknown>) => apiClient.get('/properties', { params })

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
  const price = l.price ?? 0
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
