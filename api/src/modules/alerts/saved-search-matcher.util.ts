import type { Property } from '@prisma/client';

/**
 * Translates a `SavedSearch.filters` JSON blob (shape matches `SearchQueryDto`)
 * into a match check against a synced `Property` row, for NEW_LISTING (BE-802)
 * and OPEN_HOUSE (BE-803) alert generation.
 *
 * Field-name mismatch to note: `filters.propertyType` (comma-separated, from the
 * search UI) maps to `Property.propertySubType` (singular) — DDF's naming, not
 * ours. `filters.structureType`/`filters.bbox` are skipped entirely: DDF's
 * `StructureType` isn't mapped onto `Property` in `ddf-property.sync.ts`, and
 * bbox matching would need lat/lng geo logic — neither is worth building until
 * there's evidence users rely on them for alerting. A saved search that only
 * narrows on those axes will over-match rather than silently never fire.
 */
export function matchesSavedSearch(
  property: Property,
  filters: Record<string, unknown>,
): boolean {
  const city = filters.city as string | undefined;
  if (city && property.city?.toLowerCase() !== city.toLowerCase()) return false;

  const province = filters.province as string | undefined;
  if (province && property.province?.toLowerCase() !== province.toLowerCase())
    return false;

  // Mirrors ddf-query.service.ts's live-search handling of the same fields:
  // `q` is a free-text OR-contains match against address/city/postalCode
  // (not province or description, despite SearchQueryDto's stale comment),
  // and `status` is an exact match against DDF's StandardStatus.
  const q = (filters.q as string | undefined)?.trim().toLowerCase();
  if (q) {
    const haystack = [property.address, property.city, property.postalCode]
      .filter((v): v is string => !!v)
      .map((v) => v.toLowerCase());
    if (!haystack.some((v) => v.includes(q))) return false;
  }

  const status = filters.status as string | undefined;
  if (status && property.status.toLowerCase() !== status.toLowerCase())
    return false;

  const listingType = (filters.listingType as string | undefined) ?? 'For Sale';
  const priceField =
    listingType === 'For Rent' ? property.leaseAmount : property.price;

  const minPrice = filters.minPrice as number | undefined;
  if (minPrice !== undefined && minPrice !== null) {
    if (priceField === null || priceField < minPrice) return false;
  }
  const maxPrice = filters.maxPrice as number | undefined;
  if (maxPrice !== undefined && maxPrice !== null) {
    if (priceField === null || priceField > maxPrice) return false;
  }

  const exact = filters.exactBedsBaths === true;
  const beds = filters.beds as number | undefined;
  if (beds !== undefined && beds !== null) {
    if (property.beds === null) return false;
    if (exact ? property.beds !== beds : property.beds < beds) return false;
  }
  const baths = filters.baths as number | undefined;
  if (baths !== undefined && baths !== null) {
    if (property.baths === null) return false;
    if (exact ? property.baths !== baths : property.baths < baths) return false;
  }

  const propertyType = filters.propertyType as string | undefined;
  if (propertyType) {
    const wanted = propertyType
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);
    if (wanted.length > 0) {
      const actual = property.propertySubType?.toLowerCase() ?? '';
      if (!wanted.includes(actual)) return false;
    }
  }

  const minSqft = filters.minSqft as number | undefined;
  if (minSqft !== undefined && minSqft !== null) {
    if (property.sqft === null || property.sqft < minSqft) return false;
  }
  const maxSqft = filters.maxSqft as number | undefined;
  if (maxSqft !== undefined && maxSqft !== null) {
    if (property.sqft === null || property.sqft > maxSqft) return false;
  }

  const yearBuiltMin = filters.yearBuiltMin as number | undefined;
  if (yearBuiltMin !== undefined && yearBuiltMin !== null) {
    if (property.yearBuilt === null || property.yearBuilt < yearBuiltMin)
      return false;
  }

  const parkingMin = filters.parkingMin as number | undefined;
  if (parkingMin !== undefined && parkingMin !== null) {
    if (property.parkingTotal === null || property.parkingTotal < parkingMin)
      return false;
  }

  return true;
}
