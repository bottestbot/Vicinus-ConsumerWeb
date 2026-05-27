'use client'

// FE-410: ListingActivityMap — nearby price comparison
import dynamic from 'next/dynamic'
import type { NearbyListing } from '@/types/property'

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

      <div className="rounded-2xl overflow-hidden border border-[#E8E6E1] shadow-sm" style={{ height: 380 }}>
        <ActivityMapInner {...props} />
      </div>

      <p className="text-[10px] text-[#6B6B6B] mt-2">
        Prices shown are list prices for active listings within a 1 km radius. Data sourced from MLS®.
      </p>
    </section>
  )
}
