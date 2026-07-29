import { getMockVibeCheckResult } from '@/lib/vibe-check/fixtures'
import { renderVibeShareImage, VIBE_SHARE_IMAGE_SIZE } from '@/lib/vibe-check/share-image'

// Per-result share image for /vibe/[shortId] (NEIGHBOURHOOD_VIBE_CHECK_PRD.md
// §9-10) — bakes archetype/neighbourhood/match% into the link preview so a
// bare pasted URL unfurls with the payoff, no click required.
// NOTE: params is a Promise<{ shortId }> in Next.js 16 App Router — must be awaited.
export const alt = 'Your Neighbourhood Vibe Check result'
export const size = VIBE_SHARE_IMAGE_SIZE
export const contentType = 'image/png'

interface ImageProps {
  params: Promise<{ shortId: string }>
}

export default async function Image({ params }: ImageProps) {
  const { shortId } = await params
  const result = getMockVibeCheckResult(shortId)
  return renderVibeShareImage(result)
}
