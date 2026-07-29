'use client'

// FE-410: ListingActivityMap — nearby price comparison
import dynamic from 'next/dynamic'
import type { NearbyListing } from '@/types/property'
import { useInView } from '@/hooks/useInView'

const ActivityMapInner = dynamic(() => import('./ActivityMapInner'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-[#1C2020] flex items-center justify-center">
      <div className="text-white/40 text-sm">Loading map…</div>
    </div>
  ),
})

interface ListingActivityMapProps {
  latitude: number
  longitude: number
  address: string
  currentPrice: number
  nearbyListings: NearbyListing[]
}

export default function ListingActivityMap(props: ListingActivityMapProps) {
  // Cost: a GL mount bills a Mapbox map load, and this section is below the
  // fold — defer until the user actually scrolls near it (latched, so it
  // never unmounts and re-bills on the way back up).
  const { ref, inView } = useInView<HTMLDivElement>('200px')

  return (
    <section>
      <div className="flex items-baseline justify-between mb-4">
        <h2 className="font-heading text-xl font-semibold text-[#111111]">
          Listing Activity Around this Property
        </h2>
        <span className="text-xs text-[#6B6B6B]">
          {props.nearbyListings.length} nearby listings
        </span>
      </div>

      <div
        ref={ref}
        className="rounded-2xl overflow-hidden border border-[#E8E6E1] shadow-sm"
        style={{ height: 380 }}
      >
        {inView ? (
          <ActivityMapInner {...props} />
        ) : (
          <div className="w-full h-full bg-[#1C2020] flex items-center justify-center">
            <div className="text-white/40 text-sm">Loading map…</div>
          </div>
        )}
      </div>

      <p className="text-[10px] text-[#6B6B6B] mt-2">
        Prices shown are list prices for active listings within a 1 km radius. Data sourced from MLS®.
      </p>
    </section>
  )
}
