// NBHD-14 — Local information tiles. Two-up (stacks on mobile): a static map on
// the left (server-provided URL, or a Mapbox Static fallback from the centroid)
// and a street-view image on the right (or a camera placeholder when absent).
import Image from 'next/image'
import { Camera } from 'lucide-react'
import { getNeighbourhoodMapImageUrl } from '@/lib/neighbourhood-images'
import type { NeighbourhoodDetailResponse } from '@/types/neighbourhood-detail'

interface Props {
  localInfoTiles: NeighbourhoodDetailResponse['localInfoTiles']
  neighbourhood: NeighbourhoodDetailResponse['neighbourhood']
}

function hasCoords(lat: number, lng: number): boolean {
  return Number.isFinite(lat) && Number.isFinite(lng) && (lat !== 0 || lng !== 0)
}

function Tile({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative h-[240px] overflow-hidden rounded-xl bg-[#E8E6E1] ring-1 ring-[#E8E6E1]">
      {children}
    </div>
  )
}

export default function LocalInfoTiles({ localInfoTiles, neighbourhood }: Props) {
  const { staticMapUrl, streetViewUrl } = localInfoTiles
  const { centroidLat, centroidLng, name } = neighbourhood

  const mapUrl =
    staticMapUrl ??
    (hasCoords(centroidLat, centroidLng)
      ? getNeighbourhoodMapImageUrl(centroidLat, centroidLng)
      : null)

  return (
    <section className="py-10 border-b border-[#E8E6E1]">
      <p className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-[#1C3829]">
        Get Oriented
      </p>
      <h2 className="mb-6 font-heading text-3xl font-semibold text-[#111111]">Local Information.</h2>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Map tile */}
        <Tile>
          {mapUrl ? (
            <Image
              src={mapUrl}
              alt={`Map of ${name}`}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-[#6B6B6B]">
              Map unavailable
            </div>
          )}
          <span className="absolute bottom-3 left-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-[#1C3829] backdrop-blur-sm">
            Map view
          </span>
        </Tile>

        {/* Street view tile */}
        <Tile>
          {streetViewUrl ? (
            <Image
              src={streetViewUrl}
              alt={`Street view of ${name}`}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-[#6B6B6B]">
              <Camera size={28} strokeWidth={1.5} />
              <span className="text-sm">Street view coming soon</span>
            </div>
          )}
          <span className="absolute bottom-3 left-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-[#1C3829] backdrop-blur-sm">
            Street view
          </span>
        </Tile>
      </div>
    </section>
  )
}
