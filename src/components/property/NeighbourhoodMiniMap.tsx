// Static mini map for the "Life around {address}" section (Merge 3 design).
//
// Cost decision (map-cost option 3): this card renders a Mapbox Static Images
// API <img> instead of a GL instance — the card was already non-interactive,
// a static request is ~5× cheaper than a GL map load, and the URL is
// deterministic per listing so browser/CDN caches absorb repeats. The
// neighbourhood boundary, POI dots and listing pin are drawn client-side as an
// SVG/HTML overlay projected with the same web-mercator math the imagery uses,
// which also lets the personalization layer flip a dot to "hot" without
// refetching imagery. No 'use client': there is no interactivity here, so the
// whole card server-renders (better LCP than the old ssr:false GL mount).
import { MapPin, TreePine, GraduationCap, HeartPulse, ShoppingBag, TrainFront } from 'lucide-react'
import type { BoundaryGeometry } from '@/types/neighbourhood-detail'
import { fitStaticMapView, projectToStaticPixel, type StaticMapView } from '@/lib/geo'

// Logical image size. Requested @2x, so the delivered bitmap is 1600×800 —
// crisp at any card width. The overlay SVG shares this coordinate space.
const MAP_W = 800
const MAP_H = 400

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? ''

export type MiniMapPoiKind = 'parks' | 'schools' | 'healthcare' | 'shop' | 'transit'

export interface MiniMapPoi {
  id: string
  name: string
  lat: number
  lng: number
  kind: MiniMapPoiKind
  /** Matches a saved priority — renders lime-filled (wired by personalization). */
  hot?: boolean
}

interface NeighbourhoodMiniMapProps {
  latitude: number
  longitude: number
  address: string
  neighbourhoodName?: string | null
  city?: string | null
  boundary?: BoundaryGeometry | null
  pois?: MiniMapPoi[]
}

const POI_ICONS: Record<MiniMapPoiKind, typeof TreePine> = {
  parks: TreePine,
  schools: GraduationCap,
  healthcare: HeartPulse,
  shop: ShoppingBag,
  transit: TrainFront,
}

function StaticPlaceholder({ address }: { address: string }) {
  return (
    <div className="w-full h-full bg-gradient-to-br from-[#E8E6E1] to-[#CECAB8] flex flex-col items-center justify-center gap-3">
      <div className="w-10 h-10 rounded-full bg-[#1C3829] flex items-center justify-center shadow-lg">
        <MapPin size={18} className="text-white" />
      </div>
      <div className="text-center px-4">
        <p className="text-xs font-semibold text-[#111111] truncate max-w-[180px]">{address}</p>
        <p className="text-[10px] text-[#6B6B6B] mt-0.5">Map preview unavailable</p>
      </div>
    </div>
  )
}

/** Outer rings of a Polygon/MultiPolygon as [lng, lat] vertex lists. */
function outerRings(boundary: BoundaryGeometry | null | undefined): number[][][] {
  if (!boundary) return []
  if (boundary.type === 'Polygon') {
    const ring = (boundary.coordinates as number[][][])[0]
    return ring ? [ring] : []
  }
  return (boundary.coordinates as number[][][][])
    .map((polygon) => polygon[0])
    .filter((ring): ring is number[][] => Array.isArray(ring) && ring.length > 2)
}

function validCoords(lat: number, lng: number): boolean {
  return Number.isFinite(lat) && Number.isFinite(lng) && !(lat === 0 && lng === 0)
}

export default function NeighbourhoodMiniMap({
  latitude,
  longitude,
  address,
  neighbourhoodName,
  city,
  boundary,
  pois = [],
}: NeighbourhoodMiniMapProps) {
  const hasHome = validCoords(latitude, longitude)
  if (!MAPBOX_TOKEN || !hasHome) {
    return <StaticPlaceholder address={address} />
  }

  const rings = outerRings(boundary)
  const shownPois = pois.filter((p) => validCoords(p.lat, p.lng))

  // Frame the boundary when we have one (the pin is inside it by definition of
  // the resolver); otherwise frame the pin + POIs; otherwise just the pin.
  const framePoints: Array<{ lat: number; lng: number }> = rings.length
    ? rings.flatMap((ring) => ring.map(([lng, lat]) => ({ lat, lng })))
    : [{ lat: latitude, lng: longitude }, ...shownPois]

  const view: StaticMapView = fitStaticMapView(framePoints, MAP_W, MAP_H, {
    fallbackCenter: { lat: latitude, lng: longitude },
  }) ?? { centerLat: latitude, centerLng: longitude, zoom: 14 }

  const src =
    `https://api.mapbox.com/styles/v1/mapbox/light-v11/static/` +
    `${view.centerLng.toFixed(6)},${view.centerLat.toFixed(6)},${view.zoom}` +
    `/${MAP_W}x${MAP_H}@2x?access_token=${MAPBOX_TOKEN}`

  const project = (lat: number, lng: number) => projectToStaticPixel(view, MAP_W, MAP_H, lat, lng)
  const inFrame = (p: { x: number; y: number }) =>
    p.x >= 0 && p.x <= MAP_W && p.y >= 0 && p.y <= MAP_H

  const ringPaths = rings.map(
    (ring) =>
      ring
        .map(([lng, lat], i) => {
          const { x, y } = project(lat, lng)
          return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`
        })
        .join(' ') + ' Z',
  )

  const pin = project(latitude, longitude)

  return (
    <div className="relative w-full h-full min-h-[190px] overflow-hidden">
      {/* Basemap. Plain <img> (not next/image): the URL carries the token and
          is already a rendered bitmap — optimisation passes add nothing. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={`Map of ${neighbourhoodName ?? address}`}
        width={MAP_W}
        height={MAP_H}
        className="absolute inset-0 h-full w-full object-cover"
        loading="lazy"
        decoding="async"
      />

      {/* Boundary + markers share the image's 800×400 space. The SVG scales
          with the img because both fill the container; object-cover cropping
          is avoided by keeping the container at the image's aspect ratio in
          the section layout. */}
      <svg
        viewBox={`0 0 ${MAP_W} ${MAP_H}`}
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 h-full w-full"
        aria-hidden="true"
      >
        {ringPaths.map((d, i) => (
          <g key={i}>
            <path d={d} fill="#A3E635" fillOpacity="0.07" />
            <path
              d={d}
              fill="none"
              stroke="#1C3829"
              strokeOpacity="0.3"
              strokeWidth="2.5"
              strokeDasharray="8 6"
            />
          </g>
        ))}

        {/* POI dots */}
        {shownPois.map((poi) => {
          const p = project(poi.lat, poi.lng)
          if (!inFrame(p)) return null
          const Icon = POI_ICONS[poi.kind]
          return (
            <g key={poi.id} transform={`translate(${p.x.toFixed(1)}, ${p.y.toFixed(1)})`}>
              <title>{poi.name}</title>
              <circle
                r="15"
                fill={poi.hot ? '#A3E635' : '#FFFFFF'}
                stroke="#1C3829"
                strokeWidth="2"
              />
              <Icon size={15} x={-7.5} y={-7.5} color="#1C3829" strokeWidth={2.25} />
            </g>
          )
        })}

        {/* Listing pin — drawn last so it wins overlaps. */}
        <g transform={`translate(${pin.x.toFixed(1)}, ${pin.y.toFixed(1)})`}>
          <line x1="0" y1="0" x2="0" y2="-16" stroke="#1C3829" strokeWidth="3.5" />
          <circle r="3.5" fill="#1C3829" />
          <circle cy="-30" r="17" fill="#1C3829" />
          <circle cy="-30" r="5.5" fill="none" stroke="#FFFFFF" strokeWidth="3" />
        </g>
      </svg>

      {/* Neighbourhood pill */}
      {neighbourhoodName && (
        <div className="absolute left-3 bottom-3 rounded-full border border-[#E8E6E1] bg-white/95 px-3 py-1.5 text-[11px] font-semibold text-[#111111]">
          {neighbourhoodName}
          {city && <span className="font-medium text-[#6B6B6B]"> · {city}</span>}
        </div>
      )}
    </div>
  )
}
