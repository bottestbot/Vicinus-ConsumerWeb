import type { DashboardData } from '@/types/dashboard'
import { STRINGS } from '@/lib/strings'

interface Props {
  data: DashboardData
}

/**
 * Dashboard header — the full-width title + a summary metric subline, sitting
 * above the two-column content grid (DASH-01).
 *
 * The subline reports ONLY counts we can compute honestly from the dashboard
 * payload (saved / recently-viewed). The comp also shows "open houses this week"
 * and "new matches today"; those are alert-derived and not on this payload, so
 * they're deliberately omitted here rather than fabricated — see DASH-02 /
 * JUL21FIX-11 for why a made-up count is a trust + DDF problem.
 */
export default function WelcomeBanner({ data }: Props) {
  const firstName =
    data.user.fullName?.split(' ')[0] ?? STRINGS.DASHBOARD_WELCOME_FALLBACK_NAME

  const savedCount = data.saved.length
  const visitedCount = data.visited.length

  const metrics: string[] = [
    `${savedCount} saved ${savedCount === 1 ? 'property' : 'properties'}`,
  ]
  if (visitedCount > 0) {
    metrics.push(`${visitedCount} recently viewed`)
  }

  return (
    <div>
      <h1 className="font-heading text-4xl sm:text-5xl font-semibold text-[#111111] mb-2">
        {STRINGS.DASHBOARD_WELCOME_TITLE.replace('{firstName}', firstName)}
      </h1>
      <p className="text-sm text-[#6B6B6B]">{metrics.join(' · ')}</p>
    </div>
  )
}
