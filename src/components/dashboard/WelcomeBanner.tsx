import type { DashboardData } from '@/types/dashboard'
import RecentSearches from './RecentSearches'
import HeroSearchBar from '@/components/landing/HeroSearchBar'

interface Props {
  data: DashboardData
}

/**
 * The two cities named in the welcome line. Derived from what the user has
 * actually saved (JUL21FIX-10) — the previous copy hardcoded "Chelsea and
 * Aspen", neither of which we carry listings for, so the invitation led to
 * guaranteed empty results.
 */
function topCities(data: DashboardData): string[] {
  const counts = new Map<string, number>()
  for (const s of data.saved) {
    const city = s.property.city?.trim()
    if (city) counts.set(city, (counts.get(city) ?? 0) + 1)
  }
  const ranked = [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([city]) => city)
  // No saves yet (or none carrying a city) → real BC markets we do serve.
  return ranked.length > 0 ? ranked.slice(0, 2) : FALLBACK_CITIES
}

const FALLBACK_CITIES = ['Vancouver', 'Kelowna']

export default function WelcomeBanner({ data }: Props) {
  const firstName = data.user.fullName?.split(' ')[0] ?? 'there'
  const savedCount = data.saved.length
  const cities = topCities(data)
  const citiesLabel = cities.length > 1 ? `${cities[0]} and ${cities[1]}` : cities[0]

  return (
    <div className="mb-8">
      <h1 className="font-heading text-4xl sm:text-5xl font-semibold text-[#111111] mb-3">
        Welcome back, {firstName}.
      </h1>
      {/* JUL21FIX-11: the old line asserted "{n} new updates since your last
          visit" from a number that counted nothing — a user with zero saves was
          still told they had 2. Say only what we can actually back. */}
      <p className="text-sm text-[#6B6B6B] max-w-xl">
        {savedCount > 0 ? (
          <>
            Your curated portfolio holds{' '}
            <span className="font-semibold text-[#111111]">
              {savedCount} {savedCount === 1 ? 'property' : 'properties'}
            </span>
            . Explore more in {citiesLabel}.
          </>
        ) : (
          <>Start your portfolio — explore homes in {citiesLabel}.</>
        )}
      </p>

      {/* Search bar */}
      <div className="mt-6 mb-2">
        <HeroSearchBar tone="on-light" />
      </div>

      <RecentSearches />
    </div>
  )
}
