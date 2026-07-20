'use client'

// NBHD-13 — Local essentials. Four tabs (Schools · Healthcare · Parks · Shop &
// Eat), each listing up to six POIs with a category icon, formatted distance,
// and a lime "walkable" chip for anything within 400 m. Per-tab empty state.
import { useState } from 'react'
import { GraduationCap, HeartPulse, TreePine, ShoppingBag, type LucideIcon } from 'lucide-react'
import { formatDistance } from '@/lib/format'
import type { NeighbourhoodDetailResponse, PoiItem } from '@/types/neighbourhood-detail'

interface Props {
  localEssentials: NeighbourhoodDetailResponse['localEssentials']
}

type TabKey = keyof NeighbourhoodDetailResponse['localEssentials']

const WALKABLE_THRESHOLD_M = 400
const MAX_ITEMS = 6

const TABS: { key: TabKey; label: string; icon: LucideIcon }[] = [
  { key: 'schools', label: 'Schools', icon: GraduationCap },
  { key: 'healthcare', label: 'Healthcare', icon: HeartPulse },
  { key: 'parks', label: 'Parks', icon: TreePine },
  { key: 'shopAndEat', label: 'Shop & Eat', icon: ShoppingBag },
]

function PoiRow({ item, Icon }: { item: PoiItem; Icon: LucideIcon }) {
  const walkable = item.distanceM <= WALKABLE_THRESHOLD_M
  return (
    <li className="flex items-center justify-between gap-3 py-3">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#EAF0EC] text-[#1C3829]">
          <Icon size={16} />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-[#111111]">{item.name}</p>
          <p className="truncate text-xs capitalize text-[#6B6B6B]">{item.category}</p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {walkable && (
          <span className="rounded-full bg-[#A3E635] px-2 py-0.5 text-[10px] font-semibold text-[#1C3829]">
            walkable
          </span>
        )}
        <span className="tabular-nums text-xs text-[#6B6B6B]">{formatDistance(item.distanceM)}</span>
      </div>
    </li>
  )
}

export default function LocalEssentials({ localEssentials }: Props) {
  const [active, setActive] = useState<TabKey>('schools')
  const activeTab = TABS.find((t) => t.key === active)!
  const items = localEssentials[active].slice(0, MAX_ITEMS)

  return (
    <section className="py-10 border-b border-[#E8E6E1]">
      <p className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-[#1C3829]">
        Around Here
      </p>
      <h2 className="mb-6 font-heading text-3xl font-semibold text-[#111111]">Local Essentials.</h2>

      {/* Tabs */}
      <div
        role="tablist"
        aria-label="Local essentials categories"
        className="mb-4 flex flex-wrap gap-2"
      >
        {TABS.map((tab) => {
          const selected = tab.key === active
          const Icon = tab.icon
          return (
            <button
              key={tab.key}
              role="tab"
              aria-selected={selected}
              onClick={() => setActive(tab.key)}
              className={[
                'inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors',
                selected
                  ? 'border-[#1C3829] bg-[#1C3829] text-white'
                  : 'border-[#E8E6E1] bg-white text-[#6B6B6B] hover:border-[#1C3829]/40 hover:text-[#111111]',
              ].join(' ')}
            >
              <Icon size={15} />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Panel */}
      <div
        role="tabpanel"
        className="rounded-xl border border-[#E8E6E1] bg-white px-4 sm:px-5"
      >
        {items.length === 0 ? (
          <p className="py-8 text-center text-sm text-[#6B6B6B]">
            No {activeTab.label.toLowerCase()} found nearby yet.
          </p>
        ) : (
          <ul className="divide-y divide-[#F2F0EB]">
            {items.map((item) => (
              <PoiRow key={item.id} item={item} Icon={activeTab.icon} />
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
