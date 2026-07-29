import { getMockVibeCheckResult } from '@/lib/vibe-check/fixtures'
import { renderVibeShareImage, VIBE_SHARE_IMAGE_SIZE } from '@/lib/vibe-check/share-image'

// Twitter/X card counterpart of opengraph-image.tsx — same render, same data,
// separate file so X picks up its own card image instead of falling back to og:image.
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
