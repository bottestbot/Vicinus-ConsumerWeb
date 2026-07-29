// Neighbourhood Vibe Check — shareable result page (NEIGHBOURHOOD_VIBE_CHECK_PRD.md §4, §9).
// Standalone route, no Navbar/Footer chrome: the card carries its own brand row
// so it stands alone when shared/unfurled. No backend exists yet — result is a
// mock fixture; the matching engine (built in parallel) will replace
// getMockVibeCheckResult with a real lookup by shortId, same shape.
// NOTE: params is a Promise<{ shortId }> in Next.js 16 App Router — must be awaited.
import type { Metadata } from 'next'
import VibeCheckResultCard from '@/components/vibe-check/VibeCheckResultCard'
import { getMockVibeCheckResult } from '@/lib/vibe-check/fixtures'

interface PageProps {
  params: Promise<{ shortId: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { shortId } = await params
  const result = getMockVibeCheckResult(shortId)
  return {
    title: `${result.archetypeName} — Vibe Check`,
    description: `${result.matchPercent}% match with ${result.matchedNeighbourhood.name}, ${result.matchedNeighbourhood.city}. ${result.tagline}`,
  }
}

export default async function VibeCheckResultPage({ params }: PageProps) {
  const { shortId } = await params
  const result = getMockVibeCheckResult(shortId)

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FAF9F6] px-4 py-10 font-ui">
      <VibeCheckResultCard result={result} />
    </div>
  )
}
