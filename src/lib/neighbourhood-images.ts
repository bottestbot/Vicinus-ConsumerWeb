import type { BoundaryGeometry } from '@/types/neighbourhood-detail'

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? ''

const STATIC_BASE = 'https://api.mapbox.com/styles/v1/mapbox/streets-v12/static'
// Mapbox rejects static-image requests whose URL exceeds ~8192 chars; keep a
// safety margin and fall back to a plain centred map if the encoded boundary
// overlay would blow past it.
const MAX_STATIC_URL = 8000

// Match the search map's colourful "schema": that map uses Mapbox Standard
// (mapbox-gl v3), which the Static Images API can't render — its nearest static
// equivalent is the classic `streets-v12` (full-colour parks/water/road
// hierarchy) rather than the washed-out grey `light-v11` used previously.
// @2x keeps the tiles crisp on retina card thumbnails.
export function getNeighbourhoodMapImageUrl(lat: number, lng: number): string {
  return `${STATIC_BASE}/${lng},${lat},13,0/1200x400@2x?access_token=${MAPBOX_TOKEN}`
}

// ── Hero map (NBHD detail) ────────────────────────────────────────────────────

/** Trim coordinate precision to ~11 m (4 dp) so a boundary overlay encodes into
 *  a short-enough Static Images API URL. */
function roundCoords(c: unknown): unknown {
  if (Array.isArray(c) && typeof c[0] === 'number') {
    return [Math.round((c[0] as number) * 1e4) / 1e4, Math.round((c[1] as number) * 1e4) / 1e4]
  }
  return (c as unknown[]).map(roundCoords)
}

/** A simplestyle-tagged GeoJSON Feature Mapbox renders as a lime outline with a
 *  faint fill — the neighbourhood's drawn area. */
function styledBoundaryFeature(boundary: BoundaryGeometry) {
  return {
    type: 'Feature',
    properties: {
      stroke: '#A3E635',
      'stroke-width': 3,
      'stroke-opacity': 1,
      fill: '#A3E635',
      'fill-opacity': 0.14,
    },
    geometry: { type: boundary.type, coordinates: roundCoords(boundary.coordinates) },
  }
}

/**
 * Static map for the neighbourhood-detail hero. When a `boundary` polygon is
 * available the area is drawn on the map (overlay auto-framed to fit); otherwise
 * the map is centred on the centroid. Returns null when there's no location to
 * render, so the caller can fall back to the plain panel.
 */
export function getNeighbourhoodHeroMapUrl(
  lat: number | null | undefined,
  lng: number | null | undefined,
  boundary?: BoundaryGeometry | null,
  width = 1200,
  height = 800,
): string | null {
  if (lat == null || lng == null || (lat === 0 && lng === 0)) return null
  const size = `${width}x${height}@2x`

  if (boundary?.coordinates) {
    const encoded = encodeURIComponent(JSON.stringify(styledBoundaryFeature(boundary)))
    const overlayUrl = `${STATIC_BASE}/geojson(${encoded})/auto/${size}?access_token=${MAPBOX_TOKEN}`
    if (overlayUrl.length <= MAX_STATIC_URL) return overlayUrl
    // Overlay too large for a single request — fall through to the plain map.
  }

  return `${STATIC_BASE}/${lng},${lat},12.5,0/${size}?access_token=${MAPBOX_TOKEN}`
}

export async function geocodeNeighbourhood(
  name: string,
  city: string,
): Promise<{ lat: number; lng: number } | null> {
  if (!MAPBOX_TOKEN) return null
  try {
    const query = encodeURIComponent(`${name} ${city} Canada`)
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${query}.json?country=CA&types=neighborhood,place&limit=1&access_token=${MAPBOX_TOKEN}`
    const res = await fetch(url, { next: { revalidate: 86400 } })
    if (!res.ok) return null
    const data = await res.json()
    const [lng, lat] = data?.features?.[0]?.geometry?.coordinates ?? []
    if (lat == null || lng == null) return null
    return { lat, lng }
  } catch {
    return null
  }
}

export async function geocodeCity(name: string): Promise<{ lat: number; lng: number } | null> {
  if (!MAPBOX_TOKEN) return null
  try {
    const query = encodeURIComponent(`${name} Canada`)
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${query}.json?country=CA&types=place&limit=1&access_token=${MAPBOX_TOKEN}`
    const res = await fetch(url, { next: { revalidate: 86400 } })
    if (!res.ok) return null
    const data = await res.json()
    const [lng, lat] = data?.features?.[0]?.geometry?.coordinates ?? []
    if (lat == null || lng == null) return null
    return { lat, lng }
  } catch {
    return null
  }
}
