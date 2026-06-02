import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("animate-pulse rounded-md bg-[#F2F0EB]", className)}
      {...props}
    />
  )
}

function PropertyCardSkeleton() {
  return (
    <div className="bg-white rounded-xl overflow-hidden border border-[#E8E6E1] animate-pulse">
      <div className="h-44 bg-[#F2F0EB]" />
      <div className="p-3.5 space-y-2.5">
        <div className="h-5 bg-[#F2F0EB] rounded w-2/3" />
        <div className="h-3.5 bg-[#F2F0EB] rounded w-1/2" />
        <div className="h-3 bg-[#F2F0EB] rounded w-1/3" />
        <div className="flex gap-3 mt-2">
          <div className="h-3 bg-[#F2F0EB] rounded w-12" />
          <div className="h-3 bg-[#F2F0EB] rounded w-12" />
          <div className="h-3 bg-[#F2F0EB] rounded w-16" />
        </div>
        <div className="border-t border-[#F2F0EB] pt-2.5 flex justify-between">
          <div className="h-3 bg-[#F2F0EB] rounded w-24" />
          <div className="h-3 bg-[#F2F0EB] rounded w-16" />
        </div>
      </div>
    </div>
  )
}

function NeighbourhoodCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-[#E8E6E1] overflow-hidden animate-pulse">
      <div className="h-52 bg-[#F2F0EB]" />
      <div className="p-4 flex items-center justify-between">
        <div className="h-3.5 bg-[#F2F0EB] rounded w-32" />
        <div className="h-3.5 bg-[#F2F0EB] rounded w-20" />
      </div>
    </div>
  )
}

function DashboardPropertySkeleton() {
  return (
    <div className="bg-white rounded-xl overflow-hidden border border-[#E8E6E1] animate-pulse">
      <div className="h-44 bg-[#F2F0EB]" />
      <div className="p-3.5 space-y-2">
        <div className="h-5 bg-[#F2F0EB] rounded w-1/2" />
        <div className="h-3.5 bg-[#F2F0EB] rounded w-2/3" />
        <div className="flex gap-2 mt-1">
          <div className="h-3 bg-[#F2F0EB] rounded w-10" />
          <div className="h-3 bg-[#F2F0EB] rounded w-10" />
        </div>
      </div>
    </div>
  )
}

function PropertyDetailSkeleton() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-10 animate-pulse pt-10">
      <div className="h-[420px] bg-[#F2F0EB] rounded-2xl" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <div className="h-8 bg-[#F2F0EB] rounded w-3/4" />
          <div className="h-5 bg-[#F2F0EB] rounded w-1/2" />
          <div className="flex gap-4">
            <div className="h-5 bg-[#F2F0EB] rounded w-16" />
            <div className="h-5 bg-[#F2F0EB] rounded w-16" />
            <div className="h-5 bg-[#F2F0EB] rounded w-24" />
          </div>
          <div className="space-y-2 mt-4">
            <div className="h-3 bg-[#F2F0EB] rounded" />
            <div className="h-3 bg-[#F2F0EB] rounded" />
            <div className="h-3 bg-[#F2F0EB] rounded w-3/4" />
          </div>
        </div>
        <div className="lg:col-span-1 h-64 bg-[#F2F0EB] rounded-2xl" />
      </div>
    </div>
  )
}

export { Skeleton, PropertyCardSkeleton, NeighbourhoodCardSkeleton, DashboardPropertySkeleton, PropertyDetailSkeleton }
