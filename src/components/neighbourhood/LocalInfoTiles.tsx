'use client'

// NBHD-D08 — Local information tiles. Four compact icon tiles (Map view · Street
// view · Schools · Shop & eat), each with a count/sublabel, opening the relevant
// interactive experience.
import Link from 'next/link'
import { Map, Footprints, GraduationCap, UtensilsCrossed, type LucideIcon } from 'lucide-react'
import type { NeighbourhoodDetailResponse } from '@/types/neighbourhood-detail'

interface Props {
  neighbourhood: NeighbourhoodDetailResponse['neighbourhood']
  localInfoTiles: NeighbourhoodDetailResponse['localInfoTiles']
  schoolsCount: number
  shopCount: number
}

interface Tile {
  icon: LucideIcon
  label: string
  sublabel: string
  href: string
  external?: boolean
  /** Proxied preview image (API path, key-free). Omitted for non-visual tiles. */
  preview?: string | null
}

export default function LocalInfoTiles({
  neighbourhood,
  localInfoTiles,
  schoolsCount,
  shopCount,
}: Props) {
  const { slug, centroidLat, centroidLng } = neighbourhood
  const hasCoords =
    Number.isFinite(centroidLat) && Number.isFinite(centroidLng) && (centroidLat !== 0 || centroidLng !== 0)

  // Interactive deep links. Built from the centroid — never from
  // localInfoTiles.*, which are static *image* endpoints: opening one shows a
  // flat JPEG rather than an explorable map or pano. These google.com/maps URLs
  // need no API key of their own.
  const mapHref = hasCoords
    ? `https://www.google.com/maps/@?api=1&map_action=map&center=${centroidLat},${centroidLng}&zoom=15`
    : `/search?neighbourhood=${slug}`
  const streetViewHref = hasCoords
    ? `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${centroidLat},${centroidLng}`
    : `/search?neighbourhood=${slug}`

  // Thumbnails come from Mapbox (already used for every other map in the app),
  // so the tiles don't depend on Google's Static Maps / Street View Static APIs.
  // The token is a public `pk.` token, which Mapbox intends to be client-side —
  // restrict it by URL in the Mapbox dashboard, not by hiding it.
  // Mapbox has no street-level photography, so the Street view tile shows a
  // satellite view of the same point and links out to Google's pano.
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
  const mapboxStatic = (style: string) =>
    mapboxToken && hasCoords
      ? `https://api.mapbox.com/styles/v1/mapbox/${style}/static/${centroidLng},${centroidLat},14,0/640x360@2x?access_token=${mapboxToken}&attribution=false&logo=false`
      : null

  // Fall back to the server-proxied Google image only when Mapbox isn't configured.
  const mapPreview = mapboxStatic('streets-v12') ?? localInfoTiles.staticMapUrl
  const streetPreview = mapboxStatic('satellite-streets-v12') ?? localInfoTiles.streetViewUrl

  const tiles: Tile[] = [
    {
      icon: Map,
      label: 'Map view',
      sublabel: 'Explore the area',
      href: mapHref,
      external: hasCoords,
      preview: mapPreview,
    },
    {
      icon: Footprints,
      label: 'Street view',
      sublabel: 'Virtual walk',
      href: streetViewHref,
      external: hasCoords,
      preview: streetPreview,
    },
    {
      icon: GraduationCap,
      label: 'Schools',
      sublabel: `${schoolsCount} nearby`,
      // /search ignores a `neighbourhood` param, so linking there dropped the
      // user on an unfiltered listing page. The schools are already listed in
      // Local essentials above — jump there instead.
      href: '#local-essentials',
    },
    {
      icon: UtensilsCrossed,
      label: 'Shop & eat',
      sublabel: `${shopCount} ${shopCount === 1 ? 'place' : 'places'}`,
      href: '#local-essentials',
    },
  ]

  return (
    <section className="py-10 border-b border-[#E8E6E1]">
      <p className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-[#1C3829]">
        Explore the Area
      </p>
      <h2 className="mb-6 font-heading text-3xl font-semibold text-[#111111]">Local information</h2>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {tiles.map((tile) => {
          const Icon = tile.icon
          const inner = (
            <>
              {tile.preview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={tile.preview}
                  alt=""
                  aria-hidden="true"
                  loading="lazy"
                  className="mb-3 h-24 w-full rounded-lg object-cover"
                  onError={(e) => {
                    // Tile unavailable (no key / no imagery) — drop to the icon.
                    e.currentTarget.style.display = 'none'
                  }}
                />
              ) : null}
              <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-white text-[#1C3829] ring-1 ring-[#E8E6E1]">
                <Icon size={18} />
              </span>
              <p className="text-sm font-semibold text-[#111111]">{tile.label}</p>
              <p className="text-xs text-[#6B6B6B]">{tile.sublabel}</p>
            </>
          )
          const className =
            'flex flex-col rounded-xl border border-[#E8E6E1] bg-[#F2F0EB] p-4 transition-colors hover:border-[#1C3829]/40 hover:bg-[#EDEBE4]'
          return tile.external ? (
            <a key={tile.label} href={tile.href} target="_blank" rel="noopener noreferrer" className={className}>
              {inner}
            </a>
          ) : (
            <Link key={tile.label} href={tile.href} className={className}>
              {inner}
            </Link>
          )
        })}
      </div>
    </section>
  )
}
