// Loading state for the neighbourhood detail body. Extracted from
// NeighbourhoodDetailBody (SEO-03) so it can serve both the server <Suspense>
// fallback and the client-side fallback path without duplication.
import { NeighbourhoodHeroSkeleton } from './NeighbourhoodHero'

export default function NeighbourhoodDetailSkeleton() {
  return (
    <div className="pt-6" aria-busy="true">
      <NeighbourhoodHeroSkeleton />
      <div className="mt-8 h-24 animate-pulse rounded-2xl bg-[#E8E6E1]" />
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-40 animate-pulse rounded-xl bg-[#E8E6E1]" />
        ))}
      </div>
    </div>
  )
}
