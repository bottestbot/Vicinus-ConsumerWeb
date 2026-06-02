import { Skeleton } from '@/components/ui/skeleton'

export default function NeighbourhoodDetailLoading() {
  return (
    <div className="min-h-screen bg-[#FAF9F6] pt-16 pb-16 font-ui animate-pulse">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6">
        <div className="grid lg:grid-cols-[1fr_340px] gap-5 h-[520px]">
          <Skeleton className="h-full rounded-2xl" />
          <Skeleton className="h-full rounded-2xl" />
        </div>
      </div>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 mt-10 space-y-8">
        <div className="space-y-3">
          <Skeleton className="h-8 w-48 rounded" />
          <Skeleton className="h-4 rounded w-full" />
          <Skeleton className="h-4 rounded w-5/6" />
          <Skeleton className="h-4 rounded w-3/4" />
        </div>
        <div className="flex gap-4 overflow-hidden">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-56 w-60 shrink-0 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  )
}
