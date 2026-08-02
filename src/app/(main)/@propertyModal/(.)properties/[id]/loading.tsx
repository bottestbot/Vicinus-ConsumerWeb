import { PropertyDetailSkeleton } from '@/components/ui/skeleton'

// Renders inside the overlay panel (see layout.tsx) while the listing streams.
export default function InterceptedPropertyLoading() {
  return (
    <div className="bg-[#FAF9F6] pb-8 font-ui">
      <PropertyDetailSkeleton />
    </div>
  )
}
