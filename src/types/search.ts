// ─── Property & Search Types ──────────────────────────────────────────────────

import type { SearchParams } from '@/lib/api/search'

export interface Property {
  id: string
  address: string
  city: string
  province: string
  postalCode: string
  price: number
  beds: number
  baths: number
  sqft: number
  propertyType: string
  status: 'Active' | 'Sold' | 'Coming Soon' | 'Open House'
  daysOnMarket: number
  listingType: 'For Sale' | 'For Rent'
  latitude: number
  longitude: number
  imageUrl: string
  images: string[]
  agentName: string
  agentTitle: string
  brokerageName: string
  mlsNumber: string
  /** DDF ListingURL — deep-links the "Powered by REALTOR.ca" badge (Task #4/#5). */
  realtorUrl?: string | null
  yearBuilt?: number
  parking?: number
  stories?: number
  basement?: boolean
  hoaFee?: number
  matchScore?: number
  isCuratorChoice?: boolean
  description?: string
  features?: string[]
  virtualTourUrl?: string | null
  youtubeUrl?: string | null
}

export interface SearchFiltersExtended {
  // Basic
  minPrice: number | null
  maxPrice: number | null
  beds: number | null
  baths: number | null
  /** When true, beds/baths match the selected value exactly instead of "N+". */
  bedsBathsExact: boolean
  propertyType: string[]
  /** DDF StructureType values (dwelling form) — powers the Home Type filter. */
  structureType: string[]
  status: string
  listingType: string
  minSqft: number | null
  maxSqft: number | null
  // Advanced
  minYearBuilt: number | null
  maxYearBuilt: number | null
  basement: boolean | null
  minStories: number | null
  parking: number | null
  // Listing status
  maxDaysListed: number | null
  hasOpenHouse: boolean
  comingSoon: boolean
  // Financial
  maxMonthlyPayment: number | null
  maxHoaFee: number | null
  // Rental
  petFriendly: boolean
  laundry: boolean
  utilitiesIncluded: boolean
  furnished: boolean
  shortTerm: boolean
}

// `filters` mirrors what's actually persisted server-side — the flat SearchParams
// wire shape (see filtersToSearchParams), not the store's SearchFiltersExtended.
export interface SavedSearch {
  id: string
  name: string
  filters: SearchParams
  createdAt: string
}

export interface AutocompleteSuggestion {
  id: string
  label: string
  type: 'city' | 'neighbourhood' | 'address' | 'postal'
  subtitle?: string
}

export interface MapPin {
  id: string
  latitude: number
  longitude: number
  price: number
  propertyId: string
}

/** Lightweight pin returned by GET /search/map-pins (all listings in viewport). */
export interface MapPinResponse {
  id: string
  lat: number | null
  lng: number | null
  price: number | null
}

// 'list' = Feed (full-width results) · 'both' = Map (split-pane list+map).
// The former map-only view was dropped.
export type ViewMode = 'list' | 'both'


export const MOCK_AUTOCOMPLETE: AutocompleteSuggestion[] = [
  // ── V cities (user-requested) ────────────────────────────────────────────
  { id: 'c-vancouver', label: 'Vancouver', type: 'city', subtitle: 'British Columbia' },
  { id: 'c-victoria', label: 'Victoria', type: 'city', subtitle: 'British Columbia' },
  { id: 'c-vaughan', label: 'Vaughan', type: 'city', subtitle: 'Ontario' },
  { id: 'c-vernon', label: 'Vernon', type: 'city', subtitle: 'British Columbia' },
  { id: 'c-victoriaville', label: 'Victoriaville', type: 'city', subtitle: 'Quebec' },
  { id: 'c-vaudreuil', label: 'Vaudreuil-Dorion', type: 'city', subtitle: 'Quebec' },
  { id: 'c-val-dor', label: "Val-d'Or", type: 'city', subtitle: 'Quebec' },
  // ── Ontario ─────────────────────────────────────────────────────────────
  { id: 'c-toronto', label: 'Toronto', type: 'city', subtitle: 'Ontario' },
  { id: 'c-mississauga', label: 'Mississauga', type: 'city', subtitle: 'Ontario' },
  { id: 'c-brampton', label: 'Brampton', type: 'city', subtitle: 'Ontario' },
  { id: 'c-hamilton', label: 'Hamilton', type: 'city', subtitle: 'Ontario' },
  { id: 'c-london-on', label: 'London', type: 'city', subtitle: 'Ontario' },
  { id: 'c-markham', label: 'Markham', type: 'city', subtitle: 'Ontario' },
  { id: 'c-richmond-hill', label: 'Richmond Hill', type: 'city', subtitle: 'Ontario' },
  { id: 'c-oakville', label: 'Oakville', type: 'city', subtitle: 'Ontario' },
  { id: 'c-burlington', label: 'Burlington', type: 'city', subtitle: 'Ontario' },
  { id: 'c-kitchener', label: 'Kitchener', type: 'city', subtitle: 'Ontario' },
  { id: 'c-waterloo', label: 'Waterloo', type: 'city', subtitle: 'Ontario' },
  { id: 'c-guelph', label: 'Guelph', type: 'city', subtitle: 'Ontario' },
  { id: 'c-ottawa', label: 'Ottawa', type: 'city', subtitle: 'Ontario' },
  { id: 'c-oshawa', label: 'Oshawa', type: 'city', subtitle: 'Ontario' },
  { id: 'c-barrie', label: 'Barrie', type: 'city', subtitle: 'Ontario' },
  { id: 'c-kingston', label: 'Kingston', type: 'city', subtitle: 'Ontario' },
  { id: 'c-st-catharines', label: 'St. Catharines', type: 'city', subtitle: 'Ontario' },
  { id: 'c-whitby', label: 'Whitby', type: 'city', subtitle: 'Ontario' },
  { id: 'c-ajax', label: 'Ajax', type: 'city', subtitle: 'Ontario' },
  { id: 'c-pickering', label: 'Pickering', type: 'city', subtitle: 'Ontario' },
  { id: 'c-windsor', label: 'Windsor', type: 'city', subtitle: 'Ontario' },
  { id: 'c-sudbury', label: 'Greater Sudbury', type: 'city', subtitle: 'Ontario' },
  { id: 'c-thunder-bay', label: 'Thunder Bay', type: 'city', subtitle: 'Ontario' },
  // ── British Columbia ──────────────────────────────────────────────────────
  { id: 'c-burnaby', label: 'Burnaby', type: 'city', subtitle: 'British Columbia' },
  { id: 'c-surrey', label: 'Surrey', type: 'city', subtitle: 'British Columbia' },
  { id: 'c-richmond-bc', label: 'Richmond', type: 'city', subtitle: 'British Columbia' },
  { id: 'c-kelowna', label: 'Kelowna', type: 'city', subtitle: 'British Columbia' },
  { id: 'c-abbotsford', label: 'Abbotsford', type: 'city', subtitle: 'British Columbia' },
  { id: 'c-coquitlam', label: 'Coquitlam', type: 'city', subtitle: 'British Columbia' },
  { id: 'c-langley', label: 'Langley', type: 'city', subtitle: 'British Columbia' },
  { id: 'c-north-van', label: 'North Vancouver', type: 'city', subtitle: 'British Columbia' },
  { id: 'c-west-van', label: 'West Vancouver', type: 'city', subtitle: 'British Columbia' },
  { id: 'c-nanaimo', label: 'Nanaimo', type: 'city', subtitle: 'British Columbia' },
  { id: 'c-kamloops', label: 'Kamloops', type: 'city', subtitle: 'British Columbia' },
  { id: 'c-chilliwack', label: 'Chilliwack', type: 'city', subtitle: 'British Columbia' },
  { id: 'c-prince-george', label: 'Prince George', type: 'city', subtitle: 'British Columbia' },
  // ── Alberta ───────────────────────────────────────────────────────────────
  { id: 'c-calgary', label: 'Calgary', type: 'city', subtitle: 'Alberta' },
  { id: 'c-edmonton', label: 'Edmonton', type: 'city', subtitle: 'Alberta' },
  { id: 'c-red-deer', label: 'Red Deer', type: 'city', subtitle: 'Alberta' },
  { id: 'c-lethbridge', label: 'Lethbridge', type: 'city', subtitle: 'Alberta' },
  { id: 'c-airdrie', label: 'Airdrie', type: 'city', subtitle: 'Alberta' },
  { id: 'c-st-albert', label: 'St. Albert', type: 'city', subtitle: 'Alberta' },
  { id: 'c-medicine-hat', label: 'Medicine Hat', type: 'city', subtitle: 'Alberta' },
  { id: 'c-grande-prairie', label: 'Grande Prairie', type: 'city', subtitle: 'Alberta' },
  // ── Quebec ────────────────────────────────────────────────────────────────
  { id: 'c-montreal', label: 'Montreal', type: 'city', subtitle: 'Quebec' },
  { id: 'c-quebec-city', label: 'Quebec City', type: 'city', subtitle: 'Quebec' },
  { id: 'c-laval', label: 'Laval', type: 'city', subtitle: 'Quebec' },
  { id: 'c-gatineau', label: 'Gatineau', type: 'city', subtitle: 'Quebec' },
  { id: 'c-longueuil', label: 'Longueuil', type: 'city', subtitle: 'Quebec' },
  { id: 'c-sherbrooke', label: 'Sherbrooke', type: 'city', subtitle: 'Quebec' },
  { id: 'c-saguenay', label: 'Saguenay', type: 'city', subtitle: 'Quebec' },
  { id: 'c-levis', label: 'Lévis', type: 'city', subtitle: 'Quebec' },
  // ── Prairies & Atlantic ───────────────────────────────────────────────────
  { id: 'c-winnipeg', label: 'Winnipeg', type: 'city', subtitle: 'Manitoba' },
  { id: 'c-saskatoon', label: 'Saskatoon', type: 'city', subtitle: 'Saskatchewan' },
  { id: 'c-regina', label: 'Regina', type: 'city', subtitle: 'Saskatchewan' },
  { id: 'c-halifax', label: 'Halifax', type: 'city', subtitle: 'Nova Scotia' },
  { id: 'c-moncton', label: 'Moncton', type: 'city', subtitle: 'New Brunswick' },
  { id: 'c-fredericton', label: 'Fredericton', type: 'city', subtitle: 'New Brunswick' },
  { id: 'c-saint-john', label: 'Saint John', type: 'city', subtitle: 'New Brunswick' },
  { id: 'c-charlottetown', label: 'Charlottetown', type: 'city', subtitle: 'Prince Edward Island' },
  { id: 'c-stjohns', label: "St. John's", type: 'city', subtitle: 'Newfoundland' },
  // ── Neighbourhoods (Toronto) ──────────────────────────────────────────────
  { id: 'n-rosedale', label: 'Rosedale', type: 'neighbourhood', subtitle: 'Toronto, ON' },
  { id: 'n-forest-hill', label: 'Forest Hill', type: 'neighbourhood', subtitle: 'Toronto, ON' },
  { id: 'n-annex', label: 'The Annex', type: 'neighbourhood', subtitle: 'Toronto, ON' },
  { id: 'n-yorkville', label: 'Yorkville', type: 'neighbourhood', subtitle: 'Toronto, ON' },
  { id: 'n-beaches', label: 'The Beaches', type: 'neighbourhood', subtitle: 'Toronto, ON' },
  { id: 'n-leslieville', label: 'Leslieville', type: 'neighbourhood', subtitle: 'Toronto, ON' },
  { id: 'n-liberty-village', label: 'Liberty Village', type: 'neighbourhood', subtitle: 'Toronto, ON' },
  // ── Neighbourhoods (Vancouver) ────────────────────────────────────────────
  { id: 'n-kitsilano', label: 'Kitsilano', type: 'neighbourhood', subtitle: 'Vancouver, BC' },
  { id: 'n-yaletown', label: 'Yaletown', type: 'neighbourhood', subtitle: 'Vancouver, BC' },
  { id: 'n-coal-harbour', label: 'Coal Harbour', type: 'neighbourhood', subtitle: 'Vancouver, BC' },
  { id: 'n-gastown', label: 'Gastown', type: 'neighbourhood', subtitle: 'Vancouver, BC' },
  { id: 'n-shaughnessy', label: 'Shaughnessy', type: 'neighbourhood', subtitle: 'Vancouver, BC' },
]

// Pin grouping to Canadian (comma thousands). Bare toLocaleString() uses the
// visitor's device locale — an en-IN phone renders 5_149_000 as "51,49,000".
const NUM_LOCALE = 'en-CA'

export function formatPrice(price: number | null | undefined): string {
  if (price == null || Number.isNaN(price)) return 'Price on request'
  if (price >= 1_000_000) {
    const m = price / 1_000_000
    return `$${m % 1 === 0 ? m.toFixed(0) : m.toFixed(1)}M`
  }
  if (price >= 1_000) {
    return `$${(price / 1_000).toFixed(0)}K`
  }
  return `$${price.toLocaleString(NUM_LOCALE)}`
}

export function formatFullPrice(price: number): string {
  return `$${price.toLocaleString(NUM_LOCALE)}`
}

// Friendly home-type labels → real DDF `StructureType` values (verified against
// the live feed). `StructureType` is the field that actually distinguishes
// House / Condo / Townhouse — `PropertySubType` files them all as "Single
// Family". This is the single source of truth shared by the Home Type filter
// and the property-type display label. A label may map to several values.
export const HOME_TYPES: { label: string; values: string[] }[] = [
  { label: 'House', values: ['House'] },
  { label: 'Condo / Apartment', values: ['Apartment'] },
  { label: 'Townhouse', values: ['Row / Townhouse'] },
  { label: 'Duplex', values: ['Duplex'] },
  { label: 'Multi-Family', values: ['Multi-Family'] },
  { label: 'Mobile / Manufactured', values: ['Mobile Home', 'Manufactured Home', 'Park Model Mobile Home'] },
]

// Reverse lookup: a DDF StructureType value → its friendly display label.
const STRUCTURE_TYPE_LABEL = new Map<string, string>(
  HOME_TYPES.flatMap((t) => t.values.map((v) => [v, t.label] as const)),
)

/**
 * Derive the display property-type label. Prefers `StructureType` (the real
 * dwelling-form field) and falls back to the raw `PropertySubType` only when
 * StructureType is missing or unrecognised — so a condo no longer shows as
 * "Single Family". Uses the same HOME_TYPES mapping as the Home Type filter.
 */
export function propertyTypeLabel(
  structureType?: string | string[] | null,
  propertySubType?: string | null,
): string {
  const values = Array.isArray(structureType)
    ? structureType
    : structureType
    ? [structureType]
    : []
  for (const v of values) {
    const label = STRUCTURE_TYPE_LABEL.get(v)
    if (label) return label
  }
  return propertySubType ?? ''
}
