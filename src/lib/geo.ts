// Shared geodesic helpers. Spherical-earth approximations — accurate to well
// under 0.5% at city scale, which is all the neighbourhood features need.

const EARTH_RADIUS_M = 6_371_000

/** Great-circle distance between two WGS-84 points, in metres. */
export function haversineDistanceM(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return Math.round(2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(a)))
}

// ─── Web-mercator projection (static map overlays) ──────────────────────────
// The static mini map renders a Mapbox Static Images basemap and draws the
// boundary/POI overlay itself, so it needs the exact projection the imagery
// uses: web mercator with Mapbox's 512px world tile.

const TILE_SIZE = 512
const MAX_MERCATOR_LAT = 85.051129

/** Project to normalised mercator space (x,y ∈ [0,1], y grows southward). */
export function mercatorNorm(lat: number, lng: number): { x: number; y: number } {
  const clamped = Math.max(-MAX_MERCATOR_LAT, Math.min(MAX_MERCATOR_LAT, lat))
  const rad = (clamped * Math.PI) / 180
  return {
    x: (lng + 180) / 360,
    y: (1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2,
  }
}

export interface StaticMapView {
  centerLat: number
  centerLng: number
  zoom: number
}

/**
 * Choose a centre + zoom that fits every point inside a widthPx×heightPx
 * viewport with `paddingFrac` breathing room per edge. Degenerate inputs
 * (single point, empty list) fall back to `fallbackZoom` on the first point /
 * provided centre.
 */
export function fitStaticMapView(
  points: Array<{ lat: number; lng: number }>,
  widthPx: number,
  heightPx: number,
  opts: {
    paddingFrac?: number
    minZoom?: number
    maxZoom?: number
    fallbackZoom?: number
    fallbackCenter?: { lat: number; lng: number }
  } = {},
): StaticMapView | null {
  const { paddingFrac = 0.12, minZoom = 11, maxZoom = 15.5, fallbackZoom = 14 } = opts
  const usable = points.filter(
    (p) => Number.isFinite(p.lat) && Number.isFinite(p.lng) && !(p.lat === 0 && p.lng === 0),
  )
  if (usable.length === 0) {
    const c = opts.fallbackCenter
    return c ? { centerLat: c.lat, centerLng: c.lng, zoom: fallbackZoom } : null
  }

  const norms = usable.map((p) => mercatorNorm(p.lat, p.lng))
  const minX = Math.min(...norms.map((n) => n.x))
  const maxX = Math.max(...norms.map((n) => n.x))
  const minY = Math.min(...norms.map((n) => n.y))
  const maxY = Math.max(...norms.map((n) => n.y))

  // Invert the mercator y of the bbox centre back to latitude.
  const cy = (minY + maxY) / 2
  const centerLat = (Math.atan(Math.sinh(Math.PI * (1 - 2 * cy))) * 180) / Math.PI
  const centerLng = ((minX + maxX) / 2) * 360 - 180

  const spanX = maxX - minX
  const spanY = maxY - minY
  if (spanX <= 0 && spanY <= 0) return { centerLat, centerLng, zoom: fallbackZoom }

  const effW = widthPx * (1 - paddingFrac * 2)
  const effH = heightPx * (1 - paddingFrac * 2)
  const zx = spanX > 0 ? Math.log2(effW / (TILE_SIZE * spanX)) : Number.POSITIVE_INFINITY
  const zy = spanY > 0 ? Math.log2(effH / (TILE_SIZE * spanY)) : Number.POSITIVE_INFINITY
  const zoom = Math.max(minZoom, Math.min(maxZoom, Math.min(zx, zy)))
  return { centerLat, centerLng, zoom: Math.round(zoom * 100) / 100 }
}

/** Pixel position of a point inside a widthPx×heightPx static image of `view`. */
export function projectToStaticPixel(
  view: StaticMapView,
  widthPx: number,
  heightPx: number,
  lat: number,
  lng: number,
): { x: number; y: number } {
  const worldPx = TILE_SIZE * 2 ** view.zoom
  const p = mercatorNorm(lat, lng)
  const c = mercatorNorm(view.centerLat, view.centerLng)
  return {
    x: widthPx / 2 + (p.x - c.x) * worldPx,
    y: heightPx / 2 + (p.y - c.y) * worldPx,
  }
}
