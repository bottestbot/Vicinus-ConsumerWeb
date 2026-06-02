import { PropertyDetailSkeleton } from '@/components/ui/skeleton'

export default function PropertyDetailLoading() {
  return (
    <div className="min-h-screen bg-[#FAF9F6] pt-16 pb-32 font-ui">
      <PropertyDetailSkeleton />
    </div>
  )
}
