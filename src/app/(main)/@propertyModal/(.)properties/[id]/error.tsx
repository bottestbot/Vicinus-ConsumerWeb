'use client' // Error boundaries must be Client Components

import { useEffect } from 'react'
import { RotateCw } from 'lucide-react'

// Same recovery as the standalone detail page's boundary (QA-07), scoped to the
// overlay so a failed fetch doesn't take down the search results behind it.
export default function InterceptedPropertyError({
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
    <div className="flex min-h-[60vh] items-center justify-center bg-[#FAF9F6] font-ui">
      <div className="mx-auto max-w-md px-6 text-center">
        <h2 className="font-heading mb-2 text-2xl font-semibold text-[#111111]">
          This listing couldn&apos;t load
        </h2>
        <p className="mb-6 text-sm text-[#6B6B6B]">
          Something went wrong while loading this property. This is usually
          temporary — please try again.
        </p>
        <button
          onClick={() => unstable_retry()}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1C3829] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#2D5A3D]"
        >
          <RotateCw size={15} />
          Try again
        </button>
      </div>
    </div>
  )
}
