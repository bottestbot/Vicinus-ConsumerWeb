// SEO-02 — the neighbourhood card grid, and the pure helpers that decide which
// rows it shows.
//
// Deliberately server-safe (no 'use client', no hooks): the index page renders the
// default grid as a Server Component so the 41 `<a href="/neighbourhoods/...">`
// anchors exist in the raw HTML, which is the only crawl path to the detail pages.
// NeighbourhoodsClient imports the same component for its filtered and search
// grids, so the two views can never drift apart.
import Link from 'next/link'
import Image from 'next/image'
import type { Neighbourhood } from '@/types/neighbourhood'
import { formatPrice } from '@/types/search'
import { getNeighbourhoodMapImageUrl } from '@/lib/neighbourhood-images'

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1548656848-c80e1d02d05a?w=800&q=80'

export const ALL_CITIES = 'all-cities'

/**
 * Rows the index is willing to browse into. Rows where `name === city` are bare
 * municipalities (seeded so cities are searchable), not places to browse into.
 * Also dedupes by province+city+name to guard against legacy duplicate rows
 * (e.g. kitsilano / kitsilano-vancouver).
 */
export function browsableNeighbourhoods(all: Neighbourhood[]): Neighbourhood[] {
  const seen = new Set<string>()
  const out: Neighbourhood[] = []
  for (const n of all) {
    if (n.name === n.city) continue
    const key = `${n.province}|${n.city}|${n.name}`.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    out.push(n)
  }
  return out
}

/** NBR-02: the province the index opens on. */
export function defaultProvince(all: Neighbourhood[]): string {
  const provinces = [...new Set(all.map((n) => n.province))]
  if (provinces.length === 1) return provinces[0]
  if (provinces.includes('BC')) return 'BC'
  const counts = new Map<string, number>()
  for (const n of all) counts.set(n.province, (counts.get(n.province) ?? 0) + 1)
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'all'
}

export function filterNeighbourhoods(
  all: Neighbourhood[],
  province: string,
  city: string,
): Neighbourhood[] {
  let result = all
  if (province !== 'all') result = result.filter((n) => n.province === province)
  if (city !== ALL_CITIES) result = result.filter((n) => n.city === city)
  return result
}

// NBR-05: showCityTag is false when a specific city is selected
export function NeighbourhoodCard({
  neighbourhood,
  showCityTag,
}: {
  neighbourhood: Neighbourhood
  showCityTag: boolean
}) {
  const imageSrc =
    neighbourhood.lat && neighbourhood.lng
      ? getNeighbourhoodMapImageUrl(neighbourhood.lat, neighbourhood.lng)
      : FALLBACK_IMAGE

  return (
    <Link href={`/neighbourhoods/${neighbourhood.slug}`} className="group">
      <article className="bg-white rounded-2xl border border-[#E8E6E1] overflow-hidden hover:border-[#1C3829]/40 hover:shadow-lg transition-all duration-300">
        <div className="relative h-52 overflow-hidden bg-[#F2F0EB]">
          <Image
            src={imageSrc}
            alt={neighbourhood.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          <div className="absolute bottom-4 left-4 right-4">
            <p className="font-heading text-xl font-bold text-white leading-tight">
              {neighbourhood.name}
            </p>
            {showCityTag && <p className="text-xs text-white/70 mt-0.5">{neighbourhood.city}</p>}
          </div>
        </div>
        <div className="p-4 flex items-center justify-between">
          <p className="text-sm text-[#6B6B6B]">
            {neighbourhood.city},{' '}
            <span className="font-medium text-[#111111]">{neighbourhood.province}</span>
          </p>
          {/* ⚠️ SEO-05: `medianPrice` on the Neighbourhood row is backfilled from
              live DDF prices. It was already on this card, but it now reaches
              server-rendered HTML — if the compliance decision says no DDF-derived
              figure may be indexed, deleting this block is the whole fix. */}
          {neighbourhood.medianPrice && (
            <p className="text-sm font-semibold text-[#111111]">
              {formatPrice(neighbourhood.medianPrice)}
              <span className="text-[10px] text-[#6B6B6B] font-normal ml-0.5">med.</span>
            </p>
          )}
        </div>
      </article>
    </Link>
  )
}

export default function NeighbourhoodGrid({
  neighbourhoods,
  showCityTag,
}: {
  neighbourhoods: Neighbourhood[]
  showCityTag: boolean
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {neighbourhoods.map((n) => (
        <NeighbourhoodCard key={n.slug} neighbourhood={n} showCityTag={showCityTag} />
      ))}
    </div>
  )
}
