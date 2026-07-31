import type { Metadata } from 'next'
import SearchPageClient, { type InitialSearch } from './SearchPageClient'

export const metadata: Metadata = {
  title: 'Search Properties',
  description: 'Search luxury Canadian real estate listings — filter by city, price, bedrooms, and more.',
}

type SearchParams = Record<string, string | string[] | undefined>

const first = (v: string | string[] | undefined): string | undefined =>
  Array.isArray(v) ? v[0] : v

function toNum(v: string | string[] | undefined): number | null {
  const s = first(v)
  if (!s) return null
  const n = Number(s)
  return Number.isFinite(n) && n > 0 ? n : null
}

// Hero form submits `priceRange=min-max` (e.g. "1000000-2000000", "5000000-")
function parsePriceRange(v: string | undefined): { minPrice: number | null; maxPrice: number | null } {
  if (!v) return { minPrice: null, maxPrice: null }
  const [min, max] = v.split('-')
  const num = (s: string | undefined) => {
    const n = Number(s)
    return s && Number.isFinite(n) && n > 0 ? n : null
  }
  return { minPrice: num(min), maxPrice: num(max) }
}

// NBHDCTA-02: box the search around a neighbourhood centroid when the
// "Explore Listings" CTA sends `lat`/`lng`. Mirrors the tightened radius used
// server-side for the neighbourhood detail page's own live-listings query
// (buildLocationClauses, NBHDCTA-04) so both surfaces agree on how wide a
// "neighbourhood" is.
// A signed parser is required here — `toNum` above rejects negatives (fine for
// price/beds/baths), but longitude in Canada is always negative.
function toSignedNum(v: string | string[] | undefined): number | null {
  const s = first(v)
  if (!s) return null
  const n = Number(s)
  return Number.isFinite(n) ? n : null
}

const NEIGHBOURHOOD_RADIUS_KM = 3
function bboxAroundNeighbourhood(lat: number, lng: number): string {
  const latDelta = NEIGHBOURHOOD_RADIUS_KM / 111
  const lngDelta = NEIGHBOURHOOD_RADIUS_KM / (111 * Math.cos((lat * Math.PI) / 180) || 111)
  return `${lng - lngDelta},${lat - latDelta},${lng + lngDelta},${lat + latDelta}`
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const sp = await searchParams
  const range = parsePriceRange(first(sp.priceRange))
  const type = first(sp.type)

  // NBHDCTA-02: the neighbourhood CTA sends lat/lng (+ name) instead of a text
  // query — a neighbourhood name rarely matches DDF's City/address fields, so a
  // bbox around the centroid is the reliable way to scope results to it.
  const lat = toSignedNum(sp.lat)
  const lng = toSignedNum(sp.lng)
  const neighbourhoodBbox = lat != null && lng != null ? bboxAroundNeighbourhood(lat, lng) : null
  const neighbourhoodName = first(sp.neighbourhood) ? first(sp.name) : undefined

  const initial: InitialSearch = {
    query: first(sp.q) ?? first(sp.city) ?? '',
    minPrice: toNum(sp.minPrice) ?? range.minPrice,
    maxPrice: toNum(sp.maxPrice) ?? range.maxPrice,
    beds: toNum(sp.beds),
    baths: toNum(sp.baths),
    propertyType: type ? type.split(',').map((t) => t.trim()).filter(Boolean) : [],
    bbox: neighbourhoodBbox,
    locationLabel: neighbourhoodName,
    // The homepage hero bar forwards the picked suggestion's DDF-queryable
    // municipality here (see HeroSearchBar) — RecentSearches also sends `city`
    // directly since it's already an exact DDF city, not a sub-area label.
    city: first(sp.city),
  }

  return <SearchPageClient initial={initial} />
}
