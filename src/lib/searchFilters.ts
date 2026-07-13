import type { SearchFiltersExtended } from '@/types/search'
import type { SearchParams } from '@/lib/api/search'

/**
 * Converts the store's rich local filter state into the flat shape the search
 * API expects (and that a saved search's `filters` blob is matched against on
 * the backend, see `saved-search-matcher.util.ts`). Single source of truth so
 * the live search page and Save Search can't drift apart on field names.
 */
export function filtersToSearchParams(filters: SearchFiltersExtended, query: string): SearchParams {
  return {
    q: query || undefined,
    minPrice: filters.minPrice ?? undefined,
    maxPrice: filters.maxPrice ?? undefined,
    beds: filters.beds ?? undefined,
    baths: filters.baths ?? undefined,
    // Only send the flag when a beds/baths value is actually set.
    exactBedsBaths: filters.bedsBathsExact && (filters.beds !== null || filters.baths !== null) ? true : undefined,
    propertyType: filters.propertyType.length > 0 ? filters.propertyType.join(',') : undefined,
    structureType: filters.structureType.length > 0 ? filters.structureType.join(',') : undefined,
    status: filters.status || undefined,
    listingType: filters.listingType || undefined,
    minSqft: filters.minSqft ?? undefined,
    maxSqft: filters.maxSqft ?? undefined,
    parkingMin: filters.parking ?? undefined,
    yearBuiltMin: filters.minYearBuilt ?? undefined,
  }
}
