import { PropertyDetailSkeleton } from '@/components/ui/skeleton'

// Streams inside the panel (see layout.tsx) — same shell as the intercepted
// overlay's loading.tsx, so a refresh mid-listing repaints the chrome first
// rather than flashing a full-bleed skeleton.
export default function PropertyDetailLoading() {
  return (
    <div className="bg-[#FAF9F6] pb-8 font-ui">
      <PropertyDetailSkeleton />
    </div>
  )
}
