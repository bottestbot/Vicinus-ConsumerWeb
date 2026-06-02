import { DashboardPropertySkeleton } from '@/components/ui/skeleton'
import { Skeleton } from '@/components/ui/skeleton'

export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-[#FAF9F6] pt-16 pb-20 animate-pulse">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-12">
        {/* Welcome banner skeleton */}
        <div className="space-y-2">
          <Skeleton className="h-8 w-64 rounded" />
          <Skeleton className="h-4 w-48 rounded" />
        </div>

        {/* Featured + panel */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Skeleton className="h-64 rounded-2xl" />
          </div>
          <Skeleton className="h-64 rounded-2xl" />
        </div>

        {/* Saved properties */}
        <div className="border-t border-[#E8E6E1] pt-10 space-y-4">
          <Skeleton className="h-7 w-44 rounded" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <DashboardPropertySkeleton key={i} />
            ))}
          </div>
        </div>

        {/* Recently visited */}
        <div className="border-t border-[#E8E6E1] pt-10 space-y-4">
          <Skeleton className="h-7 w-44 rounded" />
          <div className="flex gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-48 w-56 shrink-0 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
