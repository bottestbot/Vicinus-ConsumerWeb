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

  const streetViewHref =
    localInfoTiles.streetViewUrl ??
    (hasCoords
      ? `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${centroidLat},${centroidLng}`
      : `/search?neighbourhood=${slug}`)

  const tiles: Tile[] = [
    { icon: Map, label: 'Map view', sublabel: 'Explore the area', href: `/search?neighbourhood=${slug}` },
    { icon: Footprints, label: 'Street view', sublabel: 'Virtual walk', href: streetViewHref, external: true },
    {
      icon: GraduationCap,
      label: 'Schools',
      sublabel: `${schoolsCount} nearby`,
      href: `/search?neighbourhood=${slug}`,
    },
    {
      icon: UtensilsCrossed,
      label: 'Shop & eat',
      sublabel: `${shopCount} ${shopCount === 1 ? 'place' : 'places'}`,
      href: `/search?neighbourhood=${slug}`,
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
