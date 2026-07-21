// Shared geo + POI-category primitives for the livability scorers (NBHD-04/06/07).
// Kept dependency-free so every scorer computes distances and decays identically.

export type PoiCategory =
  | 'grocery'
  | 'restaurants'
  | 'coffee'
  | 'schools'
  | 'parks'
  | 'banks'
  | 'healthcare'
  | 'entertainment'
  | 'errands'

export const POI_CATEGORIES: PoiCategory[] = [
  'grocery',
  'restaurants',
  'coffee',
  'schools',
  'parks',
  'banks',
  'healthcare',
  'entertainment',
  'errands',
]

/** Minimal POI shape the scorers need — a subset of the Prisma NeighbourhoodPoi row. */
export interface ScorablePoi {
  category: string
  name?: string | null
  lat: number
  lng: number
}

export interface LatLng {
  lat: number
  lng: number
}

const EARTH_RADIUS_M = 6_371_000

/** Straight-line great-circle distance in metres. */
export function haversineMeters(a: LatLng, b: LatLng): number {
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)))
}

// v1 walking-distance shortcut: straight-line × 1.4 detour factor (a real
// pedestrian network route is longer than the crow-flies distance). NBHD-04
// upgrades this to osmnx/pandana network distance in a later release.
export const DETOUR_FACTOR = 1.4

/** Approximate walking distance in metres (straight-line × detour factor). */
export function walkingMeters(centroid: LatLng, poi: LatLng): number {
  return haversineMeters(centroid, poi) * DETOUR_FACTOR
}

/**
 * Linear distance-decay in [0,1]: full credit at/under `full` metres, decaying
 * linearly to zero at `zero` metres, clamped outside the band.
 */
export function distanceDecay(meters: number, full: number, zero: number): number {
  if (meters <= full) return 1
  if (meters >= zero) return 0
  return (zero - meters) / (zero - full)
}
