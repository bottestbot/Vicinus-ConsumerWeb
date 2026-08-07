'use client'

// SEO-03 — the degraded path. This is the page's pre-SEO-03 behaviour, kept as the
// fallback for when the server-side fetch comes back with nothing usable (API cold
// start, upstream outage, malformed response).
//
// Why keep it: once the fetch moved server-side, a slow or failed API would
// otherwise turn into a slow or wrong page. Rendering a shaped-but-empty payload
// would publish "No schools found nearby yet" and a 0/0/0/0 livability panel as
// fact. Handing the render back to the browser instead means the visitor still
// gets skeletons and a retry that can succeed once the API is warm — and a crawler
// gets a thin page rather than a confidently wrong one.
//
// ⚠️ N-01: this component must apply `hasServerRenderableContent` too. The server
// guard declining is what routes the render here, so without the same check the
// fallback cheerfully renders the very page the guard exists to prevent —
// on an empty composed payload that is a fabricated "Schools access 75" (from
// `gradeToScore(null)`), zeros on every other bar, and "No schools found nearby
// yet" stated as fact. Declining twice is the point: an empty payload is an
// outage to retry, not a neighbourhood with nothing in it.
import { useNeighbourhoodDetail } from '@/hooks/useNeighbourhoodDetail'
import NeighbourhoodDetailSections from './NeighbourhoodDetailSections'
import NeighbourhoodDetailSkeleton from './NeighbourhoodDetailSkeleton'
import { hasServerRenderableContent, toNonDdfDetail } from './nonDdfDetail'

interface Props {
  slug: string
  province?: string
}

export default function NeighbourhoodDetailClientBody({ slug, province }: Props) {
  const { data, isPending, isError } = useNeighbourhoodDetail(slug)

  if (isPending) return <NeighbourhoodDetailSkeleton />

  if (isError || !data || !hasServerRenderableContent(data)) {
    return (
      <div className="pt-6">
        <div className="rounded-2xl border border-[#E8E6E1] bg-white p-10 text-center">
          <p className="font-heading text-2xl font-semibold text-[#111111]">
            We couldn&apos;t load this neighbourhood.
          </p>
          <p className="mt-2 text-sm text-[#6B6B6B]">Please try again in a moment.</p>
        </div>
      </div>
    )
  }

  return (
    <NeighbourhoodDetailSections
      slug={slug}
      detail={toNonDdfDetail(data)}
      province={province}
    />
  )
}
