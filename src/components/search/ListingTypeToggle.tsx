'use client'

// Buy/Rent segmented pill for the floating filter bar (RENT-02). Buy and Rent
// are separate routes now (/buy and /rent), so the pill is route navigation:
// the active side comes from the pathname, not from the filter store, and the
// listing type reaches the search screen as a route prop.

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { useMemo } from 'react'
import { track } from '@/lib/analytics/capture'
import type { ListingType } from '@/types/search'
import { glass, type GlassTheme } from './glassTheme'

const TYPES: { id: ListingType; label: string; href: '/buy' | '/rent' }[] = [
  { id: 'For Sale', label: 'Buy', href: '/buy' },
  { id: 'For Rent', label: 'Rent', href: '/rent' },
]

// Everything else in the query string (q, city, beds, baths, type, bbox…) rides
// along so a searched "Burnaby, 2 beds" survives the flip. These do not:
// - price, because sale and rent live on different scales ($100Ks vs $1000s/mo)
//   and a carried-over sale band would silently empty the rent results;
// - listingType, which the route itself now decides — a stale copy in the URL
//   would only contradict the path.
const DROPPED_ON_SWITCH = ['minPrice', 'maxPrice', 'priceRange', 'listingType']

export default function ListingTypeToggle({
  theme = 'dark',
  // The route's own listing type, when the bar's parent already knows it. Only
  // a fallback: the pathname is the source of truth, so the pill can never
  // disagree with the URL the user is looking at.
  listingType,
}: {
  theme?: GlassTheme
  listingType?: ListingType
}) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const t = glass(theme)

  const activeId: ListingType = pathname?.startsWith('/rent')
    ? 'For Rent'
    : pathname?.startsWith('/buy')
      ? 'For Sale'
      : (listingType ?? 'For Sale')

  // The query string the other side is entered with.
  const carriedQuery = useMemo(() => {
    const next = new URLSearchParams(searchParams?.toString() ?? '')
    for (const key of DROPPED_ON_SWITCH) next.delete(key)
    const qs = next.toString()
    return qs ? `?${qs}` : ''
  }, [searchParams])

  return (
    <div className={`flex items-center rounded-full p-0.5 gap-0 shrink-0 ${t.toggleTrack}`}>
      {TYPES.map((v) => {
        const isActive = v.id === activeId
        return (
          <Link
            key={v.id}
            href={`${v.href}${carriedQuery}`}
            onClick={(e) => {
              // Already here: don't re-navigate (that would drop the price
              // filters the user set on this side).
              if (isActive) {
                e.preventDefault()
                return
              }
              track('filter_applied', { filter_name: 'listingType', filter_value: v.id })
            }}
            aria-pressed={isActive}
            className={[
              'px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-150',
              isActive ? 'bg-white text-[#111111] shadow-sm' : t.toggleIdle,
            ].join(' ')}
          >
            {v.label}
          </Link>
        )
      })}
    </div>
  )
}
