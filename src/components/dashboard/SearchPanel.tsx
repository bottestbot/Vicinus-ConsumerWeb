'use client'

// DASH-01/06: the dashboard "FIND YOUR HOME" search block — a white card holding
// the search bar, helper copy and recent searches, matching the placement in the
// redesign comp.
//
// Smart mode (SMART-09/11) isn't built yet, so the Smart/Classic toggle has been
// removed for now — the dashboard shows only the normal location + price search
// rather than advertising a control that doesn't work. Re-add the toggle here
// (via HeroSearchBar's `rightSlot`) when Smart search actually ships.
import HeroSearchBar from '@/components/landing/HeroSearchBar'
import RecentSearches from './RecentSearches'

export default function SearchPanel() {
  return (
    <section className="rounded-2xl border border-[#E8E6E1] bg-white p-6">
      <HeroSearchBar tone="on-light" fullWidth />

      <p className="mt-3 text-xs text-[#6B6B6B]">
        Search by location and price.
      </p>

      <RecentSearches />
    </section>
  )
}
