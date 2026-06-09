import type { DashboardData } from '@/types/dashboard'
import RecentSearches from './RecentSearches'

interface Props {
  data: DashboardData
}

export default function WelcomeBanner({ data }: Props) {
  const firstName = data.user.fullName?.split(' ')[0] ?? 'there'
  const savedCount = data.saved.length
  const newUpdates = savedCount > 0 ? Math.min(savedCount, 3) : 2

  return (
    <div className="mb-8">
      <h1 className="font-heading text-4xl sm:text-5xl font-semibold text-[#111111] mb-3">
        Welcome back, {firstName}.
      </h1>
      <p className="text-sm text-[#6B6B6B] max-w-xl">
        Your curated portfolio has{' '}
        <span className="font-semibold text-[#111111]">{newUpdates} new updates</span> since your
        last visit. Explore matches in Chelsea and Aspen.
      </p>
      <RecentSearches />
    </div>
  )
}
