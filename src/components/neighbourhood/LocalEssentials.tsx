// NBHD-D06 — Local essentials as a 4-card grid (Schools · Healthcare · Nature &
// parks · Shop & eat). Distinct per-card treatments per the mockup: a dark forest
// "Nature & parks" highlight card with an "Explore atlas" action, and category
// count chips for "Shop & eat".
import Link from 'next/link'
import { GraduationCap, HeartPulse, TreePine, ShoppingBag, ArrowRight } from 'lucide-react'
import { formatDistance } from '@/lib/format'
import type { NeighbourhoodDetailResponse, PoiItem } from '@/types/neighbourhood-detail'

interface Props {
  localEssentials: NeighbourhoodDetailResponse['localEssentials']
  neighbourhood: NeighbourhoodDetailResponse['neighbourhood']
}

const cardBase = 'rounded-xl border border-[#E8E6E1] bg-white p-4'

function CardHeader({
  icon,
  title,
  dark = false,
}: {
  icon: React.ReactNode
  title: string
  dark?: boolean
}) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <span
        className={`flex h-7 w-7 items-center justify-center rounded-lg ${
          dark ? 'bg-white/10 text-[#A3E635]' : 'bg-[#EAF0EC] text-[#1C3829]'
        }`}
      >
        {icon}
      </span>
      <h3 className={`text-sm font-semibold ${dark ? 'text-white' : 'text-[#111111]'}`}>{title}</h3>
    </div>
  )
}

function bucketShopAndEat(items: PoiItem[]) {
  const buckets: Record<string, number> = {}
  const label = (cat: string): string => {
    const c = cat.toLowerCase()
    if (/(restaurant|food|dining)/.test(c)) return 'restaurants'
    if (/(cafe|coffee)/.test(c)) return 'cafés'
    if (/(grocer|supermarket|market)/.test(c)) return 'grocers'
    if (/(shop|store|retail)/.test(c)) return 'shops'
    return 'places'
  }
  for (const item of items) {
    const key = label(item.category)
    buckets[key] = (buckets[key] ?? 0) + 1
  }
  return Object.entries(buckets)
}

export default function LocalEssentials({ localEssentials, neighbourhood }: Props) {
  const { schools, healthcare, parks, shopAndEat } = localEssentials
  const { name, city, slug } = neighbourhood
  const shopBuckets = bucketShopAndEat(shopAndEat)

  return (
    <section className="py-10 border-b border-[#E8E6E1]">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-[#1C3829]">
            The Intelligence Report
          </p>
          <h2 className="font-heading text-3xl font-semibold text-[#111111]">Local essentials</h2>
        </div>
        <p className="hidden text-xs text-[#6B6B6B] sm:block">
          {name} · {city}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Schools */}
        <div className={cardBase}>
          <CardHeader icon={<GraduationCap size={15} />} title="Schools" />
          {schools.length === 0 ? (
            <p className="text-xs text-[#6B6B6B]">No schools found nearby yet.</p>
          ) : (
            <ul className="space-y-2">
              {schools.slice(0, 3).map((s) => (
                <li key={s.id} className="flex items-baseline justify-between gap-3">
                  <span className="truncate text-sm text-[#111111]">{s.name}</span>
                  <span className="shrink-0 text-xs text-[#6B6B6B]">{formatDistance(s.distanceM)}</span>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-3 border-t border-[#F2F0EB] pt-2 text-[11px] text-[#6B6B6B]">
            Public schools · nearest by level
          </p>
        </div>

        {/* Healthcare */}
        <div className={cardBase}>
          <CardHeader icon={<HeartPulse size={15} />} title="Healthcare" />
          {healthcare.length === 0 ? (
            <p className="text-xs text-[#6B6B6B]">No facilities found nearby yet.</p>
          ) : (
            <ul className="space-y-2">
              {healthcare.slice(0, 3).map((h) => (
                <li key={h.id} className="truncate text-sm text-[#111111]">
                  {h.name}
                </li>
              ))}
            </ul>
          )}
          <p className="mt-3 border-t border-[#F2F0EB] pt-2 text-[11px] italic text-[#6B6B6B]">
            Context only — proximity, not access.
          </p>
        </div>

        {/* Nature & parks — dark highlight card */}
        <div className="rounded-xl bg-[#1C3829] p-4 text-white">
          <CardHeader icon={<TreePine size={15} />} title="Nature & parks" dark />
          <p className="text-sm leading-relaxed text-white/90">
            {parks.length > 0
              ? `${parks.length} green ${parks.length === 1 ? 'space' : 'spaces'} nearby${
                  parks[0] ? `, including ${parks[0].name}` : ''
                }${parks[1] ? ` and ${parks[1].name}` : ''}.`
              : 'Green spaces and trails around the area.'}
          </p>
          <Link
            href={`/search?neighbourhood=${slug}`}
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-[#A3E635] px-3 py-1.5 text-xs font-semibold text-[#1C3829] transition-colors hover:bg-[#b6ee54]"
          >
            Explore atlas
            <ArrowRight size={13} />
          </Link>
        </div>

        {/* Shop & eat */}
        <div className={cardBase}>
          <CardHeader icon={<ShoppingBag size={15} />} title="Shop & eat" />
          {shopBuckets.length === 0 ? (
            <p className="text-xs text-[#6B6B6B]">No shops or eateries mapped yet.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {shopBuckets.map(([label, count]) => (
                <span
                  key={label}
                  className="rounded-full bg-[#F2F0EB] px-2.5 py-1 text-xs font-medium text-[#111111]"
                >
                  {count} {label}
                </span>
              ))}
            </div>
          )}
          <p className="mt-3 border-t border-[#F2F0EB] pt-2 text-[11px] text-[#6B6B6B]">
            Walkable · 800 m radius
          </p>
        </div>
      </div>
    </section>
  )
}
