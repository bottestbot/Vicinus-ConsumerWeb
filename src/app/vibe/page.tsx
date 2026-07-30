// Neighbourhood Vibe Check — quiz entry point (NEIGHBOURHOOD_VIBE_CHECK_PRD.md
// §4, §9). Landing screen + 11-question flow, all client-side; on completion
// redirects to the shareable result page at /vibe/<shortId> (built separately,
// see src/app/vibe/[shortId]/page.tsx).
//
// VibeCheckQuiz reads `?ref=<shortId>` via useSearchParams, a Client Component
// hook — Suspense is required here so a static production build doesn't fail
// (see node_modules/next/dist/docs/01-app/03-api-reference/04-functions/use-search-params.md).
import { Suspense } from 'react'
import type { Metadata } from 'next'
import VibeCheckQuiz from '@/components/vibe-check/VibeCheckQuiz'

export const metadata: Metadata = {
  title: 'Neighbourhood Vibe Check',
  description:
    "Take the 90-second quiz and find out which Metro Vancouver neighbourhood matches your vibe.",
}

export default function VibeCheckPage() {
  return (
    <Suspense fallback={null}>
      <VibeCheckQuiz />
    </Suspense>
  )
}
