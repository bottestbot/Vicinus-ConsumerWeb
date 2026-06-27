'use client'

import { Popup } from 'react-map-gl/mapbox'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { Heart, X } from 'lucide-react'
import { useUser } from '@clerk/nextjs'
import { getPropertyDetail } from '@/lib/api/properties'
import { saveProperty, unsaveProperty } from '@/lib/api/users'
import { useUserStore } from '@/store/userStore'

const FALLBACK_IMG =
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&q=80'

interface Props {
  listingKey: string
  longitude: number
  latitude: number
  onClose: () => void
}

export default function MapListingPopup({ listingKey, longitude, latitude, onClose }: Props) {
  const router = useRouter()
  const { isSignedIn } = useUser()
  const { savedPropertyIds, toggleSaved } = useUserStore()
  const isSaved = savedPropertyIds.has(listingKey)

  const { data, isLoading } = useQuery({
    queryKey: ['listing-card', listingKey],
    queryFn: () => getPropertyDetail(listingKey),
    staleTime: 300_000,
  })

  async function handleSave(e: React.MouseEvent) {
    e.stopPropagation()
    if (!isSignedIn) {
      router.push(`/sign-in?redirect=/properties/${listingKey}`)
      return
    }
    try {
      if (isSaved) await unsaveProperty(listingKey)
      else await saveProperty(listingKey)
    } catch {
      // optimistic — still reflect locally
    }
    toggleSaved(listingKey)
  }

  const openDetail = () => router.push(`/properties/${listingKey}`)

  return (
    <Popup
      longitude={longitude}
      latitude={latitude}
      anchor="bottom"
      offset={20}
      closeButton={false}
      closeOnClick={false}
      onClose={onClose}
      maxWidth="280px"
      className="vicinus-map-popup"
    >
      <div
        role="button"
        tabIndex={0}
        onClick={openDetail}
        onKeyDown={(e) => e.key === 'Enter' && openDetail()}
        className="w-[256px] cursor-pointer bg-white rounded-xl overflow-hidden font-ui text-left"
      >
        {/* Photo */}
        <div className="relative h-36 bg-[#F2F0EB]">
          {/* plain <img>: DDF photo hosts aren't whitelisted for next/image */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={data?.images?.[0] || FALLBACK_IMG}
            alt={data?.address || 'Listing'}
            className="w-full h-full object-cover"
          />
          {/* Close */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              onClose()
            }}
            aria-label="Close"
            className="absolute top-2 left-2 w-7 h-7 rounded-full bg-white/90 flex items-center justify-center text-[#111111] shadow-sm hover:bg-white"
          >
            <X size={14} />
          </button>
          {/* Save */}
          <button
            onClick={handleSave}
            aria-label={isSaved ? 'Unsave listing' : 'Save listing'}
            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 flex items-center justify-center shadow-sm hover:bg-white"
          >
            <Heart size={14} className={isSaved ? 'fill-red-500 text-red-500' : 'text-[#111111]'} />
          </button>
        </div>

        {/* Body */}
        <div className="p-3">
          {isLoading || !data ? (
            <div className="space-y-2 animate-pulse">
              <div className="h-5 bg-[#F2F0EB] rounded w-2/3" />
              <div className="h-3.5 bg-[#F2F0EB] rounded w-full" />
              <div className="h-3 bg-[#F2F0EB] rounded w-1/2" />
            </div>
          ) : (
            <>
              <p className="text-lg font-bold text-[#111111] leading-tight">
                {data.price > 0 ? `$${data.price.toLocaleString()}` : 'Price on request'}
              </p>
              <p className="text-sm text-[#111111] mt-0.5">
                <span className="font-semibold">{data.beds}</span> bds
                {' · '}
                <span className="font-semibold">{data.baths}</span> ba
                {data.sqft > 0 && (
                  <>
                    {' · '}
                    <span className="font-semibold">{data.sqft.toLocaleString()}</span> sqft
                  </>
                )}
                {' · '}
                {data.listingType}
              </p>
              <p className="text-sm text-[#6B6B6B] truncate mt-0.5">
                {[data.address, data.city].filter(Boolean).join(', ')}
              </p>
              <p className="text-[10px] text-[#9B9B9B] mt-1 uppercase tracking-wide">
                MLS® {data.mlsNumber}
                {data.brokerageName ? ` · ${data.brokerageName}` : ''}
              </p>
            </>
          )}
        </div>
      </div>
    </Popup>
  )
}
