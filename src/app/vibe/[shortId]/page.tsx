// Neighbourhood Vibe Check — shareable result page (NEIGHBOURHOOD_VIBE_CHECK_PRD.md §4, §9).
// Standalone route, no Navbar/Footer chrome: the card carries its own brand row
// so it stands alone when shared/unfurled.
// NOTE: params is a Promise<{ shortId }> in Next.js 16 App Router — must be awaited.
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { isAxiosError } from 'axios'
import VibeCheckResultCard from '@/components/vibe-check/VibeCheckResultCard'
import VibeCheckClaimGate from '@/components/vibe-check/VibeCheckClaimGate'
import { getVibeCheckResult } from '@/lib/api/vibe-check'
import type { VibeCheckResult } from '@/types/vibe-check'

interface PageProps {
  params: Promise<{ shortId: string }>
}

// A stale/mistyped/never-existed shortId should 404, not render fake data —
// this is a shared result, not a page that should ever paper over "not found".
async function loadResult(shortId: string): Promise<VibeCheckResult> {
  try {
    const { data } = await getVibeCheckResult(shortId)
    return data
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 404) notFound()
    throw error
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { shortId } = await params
  const result = await loadResult(shortId)
  const title = `${result.archetypeName} — Vibe Check`
  const description = `${result.matchPercent}% match with ${result.matchedNeighbourhood.name}, ${result.matchedNeighbourhood.city}. ${result.tagline}`
  // Image itself comes from the colocated opengraph-image.tsx/twitter-image.tsx
  // file conventions (Next.js auto-wires the og:image/twitter:image tags from
  // those) — openGraph/twitter here just need to carry the per-result
  // title/description and repeat siteName/type since setting `openGraph`
  // replaces the root layout's rather than merging with it.
  return {
    title,
    description,
    openGraph: {
      siteName: 'Vicinus',
      type: 'website',
      title,
      description,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  }
}

export default async function VibeCheckResultPage({ params }: PageProps) {
  const { shortId } = await params
  const result = await loadResult(shortId)

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FAF9F6] px-4 py-10 font-ui">
      <VibeCheckClaimGate />
      <VibeCheckResultCard result={result} />
    </div>
  )
}
