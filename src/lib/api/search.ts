import apiClient from './client'

export interface SearchParams {
  q?: string
  city?: string
  province?: string
  minPrice?: number
  maxPrice?: number
  beds?: number
  baths?: number
  /** When true, beds/baths match exactly (eq) instead of the default "N+" (ge). */
  exactBedsBaths?: boolean
  /** Comma-separated property sub-types, e.g. "Single Family,Condo" */
  propertyType?: string
  /** Comma-separated DDF StructureType values, e.g. "House,Apartment" */
  structureType?: string
  status?: string
  /** "For Sale" | "For Rent" — distinguishes sale vs lease listings */
  listingType?: string
  minSqft?: number
  maxSqft?: number
  yearBuiltMin?: number
  parkingMin?: number
  bbox?: string
  page?: number
  limit?: number
}

export const searchProperties = (params: SearchParams) =>
  apiClient.get('/search', { params })

export const getMapPins = (params: SearchParams) =>
  apiClient.get('/search/map-pins', { params })

// Matches the backend's CreateSavedSearchDto — { name?, filters } only. `filters`
// is the flat SearchParams shape (see filtersToSearchParams), stored as-is so the
// backend's alert-matching logic (saved-search-matcher.util.ts) can read it directly.
export const saveSearch = (body: { name?: string; filters: SearchParams }) =>
  apiClient.post('/users/me/searches', body)

export const getSavedSearches = () =>
  apiClient.get('/users/me/searches')

export const deleteSavedSearch = (id: string) =>
  apiClient.delete(`/users/me/searches/${id}`)

export const getAutocomplete = (q: string) =>
  apiClient.get('/search/autocomplete', { params: { q } })
