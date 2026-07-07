'use client' // Error boundaries must be Client Components

import { useEffect } from 'react'
import { RotateCw } from 'lucide-react'

// QA-07: a transient SSR data-fetch failure used to leave the detail page
// broken until a manual reload. This boundary catches any render/fetch error in
// the route and lets the user recover in place. `unstable_retry` (Next.js 16)
// re-fetches and re-renders the segment — including the Server Component data —
// which is what a manual reload did before.
export default function PropertyDetailError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string }
  unstable_retry: () => void
}) {
  useEffect(() => {
    console.error('Property detail failed to render:', error)
  }, [error])

  return (
    <div className="min-h-screen bg-[#FAF9F6] pt-16 pb-32 font-ui flex items-center justify-center">
      <div className="max-w-md mx-auto px-6 text-center">
        <h2 className="font-heading text-2xl font-semibold text-[#111111] mb-2">
          This listing couldn&apos;t load
        </h2>
        <p className="text-sm text-[#6B6B6B] mb-6">
          Something went wrong while loading this property. This is usually
          temporary — please try again.
        </p>
        <button
          onClick={() => unstable_retry()}
          className="inline-flex items-center justify-center gap-2 bg-[#1C3829] text-white text-sm font-semibold py-2.5 px-5 rounded-xl hover:bg-[#2D5A3D] transition-colors"
        >
          <RotateCw size={15} />
          Try again
        </button>
      </div>
    </div>
  )
}
