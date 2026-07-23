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

// ── Line & polygon primitives (VIBE-01) ────────────────────────────────────
// OSM ways are lines/polygons, not points: bike lanes need length, green cover
// needs area. Both are computed on a local equirectangular projection anchored
// at `origin` — over a ~1.5km radius the distortion is negligible and it keeps
// the maths dependency-free (no proj/turf).

const METERS_PER_DEG_LAT = 110_540

/** Project a lat/lng to local metres (x east, y north) relative to `origin`. */
function toLocalMeters(origin: LatLng, p: LatLng): { x: number; y: number } {
  const metersPerDegLng = 111_320 * Math.cos((origin.lat * Math.PI) / 180)
  return {
    x: (p.lng - origin.lng) * metersPerDegLng,
    y: (p.lat - origin.lat) * METERS_PER_DEG_LAT,
  }
}

/** Total length of a polyline in metres (sum of great-circle segments). */
export function polylineMeters(points: LatLng[]): number {
  let total = 0
  for (let i = 1; i < points.length; i++) {
    total += haversineMeters(points[i - 1], points[i])
  }
  return total
}

/**
 * Absolute area of a closed ring in square metres via the shoelace formula on
 * the local projection. Returns 0 for anything that isn't a closed polygon
 * (fewer than 4 vertices, or first vertex ≠ last) so open ways are ignored.
 */
export function polygonAreaSqMeters(points: LatLng[], origin: LatLng): number {
  if (points.length < 4) return 0
  const first = points[0]
  const last = points[points.length - 1]
  if (first.lat !== last.lat || first.lng !== last.lng) return 0
  const pts = points.map((p) => toLocalMeters(origin, p))
  let sum = 0
  for (let i = 0; i < pts.length - 1; i++) {
    sum += pts[i].x * pts[i + 1].y - pts[i + 1].x * pts[i].y
  }
  return Math.abs(sum) / 2
}

/** Nearest distance in metres from `from` to any vertex of `points` (∞ if empty). */
export function nearestVertexMeters(from: LatLng, points: LatLng[]): number {
  let min = Infinity
  for (const p of points) {
    const d = haversineMeters(from, p)
    if (d < min) min = d
  }
  return min
}
