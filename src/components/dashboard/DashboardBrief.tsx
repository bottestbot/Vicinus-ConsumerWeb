import type { DashboardData } from '@/types/dashboard'
import VicinusBrief from './VicinusBrief'
import { STRINGS } from '@/lib/strings'

interface Props {
  data: DashboardData
}

const FALLBACK_CITIES = ['Vancouver', 'Kelowna']

/**
 * The two cities named in the fallback line. Derived from what the user has
 * actually saved (JUL21FIX-10) — the previous copy hardcoded "Chelsea and
 * Aspen", neither of which we carry listings for.
 */
function topCities(data: DashboardData): string[] {
  const counts = new Map<string, number>()
  for (const s of data.saved) {
    const city = s.property.city?.trim()
    if (city) counts.set(city, (counts.get(city) ?? 0) + 1)
  }
  const ranked = [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([city]) => city)
  return ranked.length > 0 ? ranked.slice(0, 2) : FALLBACK_CITIES
}

/**
 * The Vicinus IQ Brief slot at the top of the dashboard's left column (DASH-01).
 * Owns the non-fabricated fallback line rendered only when the brief endpoint is
 * unavailable — never asserts a "{n} new updates" count (JUL21FIX-11).
 */
export default function DashboardBrief({ data }: Props) {
  const savedCount = data.saved.length
  const cities = topCities(data)
  const citiesLabel = cities.length > 1 ? `${cities[0]} and ${cities[1]}` : cities[0]

  const fallbackLine =
    savedCount > 0
      ? STRINGS.DASHBOARD_WELCOME_FALLBACK_SAVED.replace('{count}', String(savedCount))
          .replace(
            '{noun}',
            savedCount === 1
              ? STRINGS.DASHBOARD_WELCOME_PROPERTY_ONE
              : STRINGS.DASHBOARD_WELCOME_PROPERTY_MANY,
          )
          .replace('{cities}', citiesLabel)
      : STRINGS.DASHBOARD_WELCOME_FALLBACK_EMPTY.replace('{cities}', citiesLabel)

  return (
    <VicinusBrief fallback={<p className="text-sm text-[#6B6B6B] max-w-xl">{fallbackLine}</p>} />
  )
}
