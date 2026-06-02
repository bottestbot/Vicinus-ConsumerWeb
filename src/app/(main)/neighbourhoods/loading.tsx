import { NeighbourhoodCardSkeleton } from '@/components/ui/skeleton'

export default function NeighbourhoodsLoading() {
  return (
    <div className="min-h-screen bg-[#FAF9F6] pt-16 pb-20 font-ui">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-10">
        <div className="mb-10 animate-pulse space-y-3">
          <div className="h-3 bg-[#F2F0EB] rounded w-32" />
          <div className="h-10 bg-[#F2F0EB] rounded w-64" />
          <div className="h-4 bg-[#F2F0EB] rounded w-96" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <NeighbourhoodCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  )
}
