import type { DashboardData } from '@/types/dashboard'

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

interface Props {
  data: DashboardData
}

export default function WelcomeBanner({ data }: Props) {
  const firstName = data.user.fullName?.split(' ')[0] ?? 'there'
  const savedCount = data.saved.length
  const visitedCount = data.visited.length

  return (
    <div className="mb-8">
      <h1 className="font-heading text-4xl sm:text-5xl font-semibold text-[#111111] mb-2">
        {getGreeting()}, {firstName}.
      </h1>
      <p className="text-sm text-[#6B6B6B]">
        {savedCount} saved {savedCount === 1 ? 'property' : 'properties'}
        {' · '}
        {visitedCount} recently viewed
      </p>
    </div>
  )
}
