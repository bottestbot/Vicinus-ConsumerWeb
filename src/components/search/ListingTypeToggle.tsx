'use client'

// Buy/Rent segmented pill for the floating filter bar (RENT-02). Writes
// `filters.listingType`, which every search surface (list, feed, map pins,
// result count) already forwards to the API via filtersToSearchParams.

import { useSearchStore } from '@/store/searchStore'
import { track } from '@/lib/analytics/capture'
import { glass, type GlassTheme } from './glassTheme'

const TYPES: { id: 'For Sale' | 'For Rent'; label: string }[] = [
  { id: 'For Sale', label: 'Buy' },
  { id: 'For Rent', label: 'Rent' },
]

export default function ListingTypeToggle({ theme = 'dark' }: { theme?: GlassTheme }) {
  const { filters, setFilter } = useSearchStore()
  const t = glass(theme)

  const select = (id: 'For Sale' | 'For Rent') => {
    if (id === filters.listingType) return
    setFilter('listingType', id)
    track('filter_applied', { filter_name: 'listingType', filter_value: id })
    // Sale and rent prices live on different scales ($100Ks vs $1000s/mo) — a
    // carried-over sale price band would silently empty the rent results.
    setFilter('minPrice', null)
    setFilter('maxPrice', null)
  }

  return (
    <div className={`flex items-center rounded-full p-0.5 gap-0 shrink-0 ${t.toggleTrack}`}>
      {TYPES.map((v) => (
        <button
          key={v.id}
          onClick={() => select(v.id)}
          aria-pressed={filters.listingType === v.id}
          className={[
            'px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-150',
            filters.listingType === v.id ? 'bg-white text-[#111111] shadow-sm' : t.toggleIdle,
          ].join(' ')}
        >
          {v.label}
        </button>
      ))}
    </div>
  )
}
