// NBHD-D06 — Local essentials as a card grid (Schools · Healthcare · Nature &
// parks · Shop & eat · Transit · Housing age). Distinct per-card treatments per
// the mockup: a dark forest "Nature & parks" highlight card with an "Explore
// atlas" action, and category count chips for "Shop & eat".
import Link from 'next/link'
import {
  GraduationCap,
  HeartPulse,
  TreePine,
  ShoppingBag,
  TrainFront,
  Building2,
  ArrowRight,
} from 'lucide-react'
import { formatDistance } from '@/lib/format'
import { bucketShopAndEat } from '@/lib/poi'
import type { NeighbourhoodDetailResponse, PoiItem } from '@/types/neighbourhood-detail'

interface Props {
  localEssentials: NeighbourhoodDetailResponse['localEssentials']
  neighbourhood: NeighbourhoodDetailResponse['neighbourhood']
  housingAge?: NeighbourhoodDetailResponse['housingAge']
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

// Bucketing lives in src/lib/poi.ts so the PDP "Life around" section and this
// card always group identically.

export default function LocalEssentials({ localEssentials, neighbourhood, housingAge }: Props) {
  const { schools, healthcare, parks, shopAndEat, transit = [], transitBus = [] } = localEssentials
  // Rail leads, then the nearest bus stop — same split as the PDP Transit tile,
  // so a bus-only area still names something concrete instead of reading empty.
  // Unnamed OSM stops are dropped: the API coerces a null name to "Unnamed",
  // which reads as a place name in a list of stations.
  const named = (list: PoiItem[]) => list.filter((p) => p.name && p.name !== 'Unnamed')
  const transitRows = [...named(transit).slice(0, 2), ...named(transitBus).slice(0, 1)].sort(
    (a, b) => a.distanceM - b.distanceM,
  )
  const { name, city, slug } = neighbourhood
  const shopBuckets = bucketShopAndEat(shopAndEat)

  return (
    <section id="local-essentials" className="py-10 border-b border-[#E8E6E1]">
      <div className="mb-6 flex items-end justify-between gap-4">
        <h2 className="font-heading text-3xl font-semibold text-[#111111]">Local essentials</h2>
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
            href={`/buy?neighbourhood=${slug}`}
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
              {shopBuckets.map((b) => (
                <span
                  key={b.key}
                  className="rounded-full bg-[#F2F0EB] px-2.5 py-1 text-xs font-medium text-[#111111]"
                >
                  {b.count} {b.label}
                </span>
              ))}
            </div>
          )}
          <p className="mt-3 border-t border-[#F2F0EB] pt-2 text-[11px] text-[#6B6B6B]">
            Walkable · 800 m radius
          </p>
        </div>

        {/* Transit — rail stations first, then the nearest bus stop. */}
        <div className={cardBase}>
          <CardHeader icon={<TrainFront size={15} />} title="Transit" />
          {transit.length === 0 && transitBus.length === 0 ? (
            <p className="text-xs text-[#6B6B6B]">No transit stops mapped yet.</p>
          ) : (
            <ul className="space-y-2">
              {transitRows.map((t) => (
                <li key={t.id} className="flex items-baseline justify-between gap-3">
                  <span className="truncate text-sm text-[#111111]">{t.name}</span>
                  <span className="shrink-0 text-xs text-[#6B6B6B]">
                    {formatDistance(t.distanceM)}
                  </span>
                </li>
              ))}
              {/* Counts are measured data, so they sit in the list with the
                  named stops — not in the muted footnote, which is reserved for
                  the "what this card means" line every card carries. */}
              {transit.length > 0 && (
                <li className="flex items-baseline justify-between gap-3">
                  <span className="truncate text-sm text-[#111111]">Rail stations nearby</span>
                  <span className="shrink-0 text-xs text-[#6B6B6B]">{transit.length}</span>
                </li>
              )}
              {transitBus.length > 0 && (
                <li className="flex items-baseline justify-between gap-3">
                  <span className="truncate text-sm text-[#111111]">Bus stops nearby</span>
                  <span className="shrink-0 text-xs text-[#6B6B6B]">{transitBus.length}</span>
                </li>
              )}
            </ul>
          )}
          <p className="mt-3 border-t border-[#F2F0EB] pt-2 text-[11px] text-[#6B6B6B]">
            Rail and bus · 1.5 km radius
          </p>
        </div>

        {/* Housing age — build years of nearby listings. Named for the buildings
            on purpose: plain "Age" reads as resident age next to Schools and
            Transit, and resident age is a separate (unbuilt) census dataset.
            Hidden entirely when the API sends null (no centroid, or too thin a
            sample to state a median). */}
        {housingAge && (
          <div className={cardBase}>
            <CardHeader icon={<Building2 size={15} />} title="Housing age" />
            <ul className="space-y-2">
              <li className="flex items-baseline justify-between gap-3">
                <span className="truncate text-sm text-[#111111]">Typical build year</span>
                <span className="shrink-0 text-xs text-[#6B6B6B]">
                  {housingAge.medianYearBuilt}
                </span>
              </li>
              <li className="flex items-baseline justify-between gap-3">
                <span className="truncate text-sm text-[#111111]">Oldest to newest</span>
                <span className="shrink-0 text-xs text-[#6B6B6B]">
                  {housingAge.oldestYearBuilt}–{housingAge.newestYearBuilt}
                </span>
              </li>
            </ul>
            {housingAge.eras.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {housingAge.eras.map((e) => (
                  <span
                    key={e.label}
                    className="rounded-full bg-[#F2F0EB] px-2.5 py-1 text-xs font-medium text-[#111111]"
                  >
                    {e.label} · {e.count}
                  </span>
                ))}
              </div>
            )}
            {/* Sample size is not decoration — this is a listings sample, not
                the housing stock, and the card must not read as the latter. */}
            <p className="mt-3 border-t border-[#F2F0EB] pt-2 text-[11px] text-[#6B6B6B]">
              From {housingAge.sampleSize} listings within 1.5 km
            </p>
          </div>
        )}
      </div>
    </section>
  )
}
