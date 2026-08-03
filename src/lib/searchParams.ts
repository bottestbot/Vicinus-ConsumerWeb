// URL searchParams → the initial state the search screen hydrates from.
//
// Shared by /buy and /rent (and the legacy /search redirect) so the two routes
// can never drift on how a param is read. Everything here is listing-type
// agnostic — that comes from the route itself, as a prop, not from the URL.

export interface InitialSearch {
  query: string
  minPrice: number | null
  maxPrice: number | null
  beds: number | null
  baths: number | null
  propertyType: string[]
  // NBHDCTA-02: set when arriving from a neighbourhood's "Explore Listings" CTA
  // — a bbox around that neighbourhood's centroid, and its name for the results
  // header (a neighbourhood name isn't a searchable city/address `q`).
  bbox?: string | null
  locationLabel?: string
  // The DDF-queryable municipality behind `query`, when it came from picking a
  // homepage-hero autocomplete suggestion rather than typed free text — mirrors
  // SearchBar's own selectedCity (see AutocompleteSuggestion.city). Without
  // this, a sub-area/neighbourhood label like "South Surrey" or "Ambleside"
  // never substring-matches DDF's City field, and re-geocoding the bare label
  // (no city/province qualifier) can resolve to a same-named place elsewhere
  // in Canada.
  city?: string
}

export type SearchParamsInput = Record<string, string | string[] | undefined>

const first = (v: string | string[] | undefined): string | undefined =>
  Array.isArray(v) ? v[0] : v

function toNum(v: string | string[] | undefined): number | null {
  const s = first(v)
  if (!s) return null
  const n = Number(s)
  return Number.isFinite(n) && n > 0 ? n : null
}

// A signed parser is required alongside `toNum` above — that one rejects
// negatives (fine for price/beds/baths), but longitude in Canada is always
// negative.
function toSignedNum(v: string | string[] | undefined): number | null {
  const s = first(v)
  if (!s) return null
  const n = Number(s)
  return Number.isFinite(n) ? n : null
}

// The homepage hero form submits `priceRange=min-max` (e.g. "1000000-2000000",
// "5000000-"). The hero no longer renders a price control, but older links and
// saved searches still carry this param.
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
const NEIGHBOURHOOD_RADIUS_KM = 3
function bboxAroundNeighbourhood(lat: number, lng: number): string {
  const latDelta = NEIGHBOURHOOD_RADIUS_KM / 111
  const lngDelta = NEIGHBOURHOOD_RADIUS_KM / (111 * Math.cos((lat * Math.PI) / 180) || 111)
  return `${lng - lngDelta},${lat - latDelta},${lng + lngDelta},${lat + latDelta}`
}

export function parseInitialSearch(sp: SearchParamsInput): InitialSearch {
  const range = parsePriceRange(first(sp.priceRange))
  const type = first(sp.type)

  // The neighbourhood CTA sends lat/lng (+ name) instead of a text query — a
  // neighbourhood name rarely matches DDF's City/address fields, so a bbox
  // around the centroid is the reliable way to scope results to it.
  const lat = toSignedNum(sp.lat)
  const lng = toSignedNum(sp.lng)
  const neighbourhoodBbox = lat != null && lng != null ? bboxAroundNeighbourhood(lat, lng) : null
  const neighbourhoodName = first(sp.neighbourhood) ? first(sp.name) : undefined

  return {
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
}
