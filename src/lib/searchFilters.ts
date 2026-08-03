import type { ListingType, SearchFiltersExtended } from '@/types/search'
import type { SearchParams } from '@/lib/api/search'

/**
 * Converts the store's rich local filter state into the flat shape the search
 * API expects (and that a saved search's `filters` blob is matched against on
 * the backend, see `saved-search-matcher.util.ts`). Single source of truth so
 * the live search page and Save Search can't drift apart on field names.
 *
 * `listingType` is a required argument rather than a filter field: it belongs
 * to the route (/buy vs /rent), not to the store. It stays REQUIRED so that
 * every call site is forced to supply it — the backend alert matcher defaults
 * a missing `listingType` to "For Sale" (saved-search-matcher.util.ts), so an
 * omission here would silently turn a rent alert into a sale alert.
 */
export function filtersToSearchParams(
  filters: SearchFiltersExtended,
  query: string,
  listingType: ListingType,
): SearchParams {
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
    listingType,
    minSqft: filters.minSqft ?? undefined,
    maxSqft: filters.maxSqft ?? undefined,
    parkingMin: filters.parking ?? undefined,
    yearBuiltMin: filters.minYearBuilt ?? undefined,
    yearBuiltMax: filters.maxYearBuilt ?? undefined,
    // Tri-state: null means "no constraint", so it must not collapse to false.
    basement: filters.basement ?? undefined,
    maxDaysListed: filters.maxDaysListed ?? undefined,
  }
}
