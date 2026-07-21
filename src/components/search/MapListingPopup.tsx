'use client'

import { Popup, useMap } from 'react-map-gl/mapbox'
import type { PopupProps } from 'react-map-gl/mapbox'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { Heart, X } from 'lucide-react'
import { useUser } from '@clerk/nextjs'
import { getPropertyDetail } from '@/lib/api/properties'
import { saveProperty, unsaveProperty } from '@/lib/api/users'
import { useUserStore } from '@/store/userStore'
import PropertyCell from '@/components/property/PropertyCell'

const FALLBACK_IMG =
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&q=80'

interface Props {
  listingKey: string
  longitude: number
  latitude: number
  onClose: () => void
}

// Approximate rendered popup card size (w-[256px] shell + ~144px photo + body).
const CARD_W = 256
const CARD_H = 300
// Keep the card at least this far from the map's own edges.
const EDGE_MARGIN = 12
// The floating filter bar (SearchPageClient) is layered over the top of the map
// pane — Mapbox's own popup auto-flip only accounts for the map container, not
// this overlay, so a pin high in the viewport opens upward and hides behind it.
const OVERLAY_TOP = 84

/**
 * Choose the popup anchor so the card always opens into visible space: below the
 * pin when there isn't room above the overlay bar, and shifted left/right when a
 * centered card would spill past a horizontal edge. Anchor = the popup point
 * pinned to the marker, so `top` opens the card downward, `bottom` upward, and a
 * `-left`/`-right` suffix pins that side to the marker so the card extends inward.
 */
function pickAnchor(map: ReturnType<typeof useMap>['current'], lng: number, lat: number): PopupProps['anchor'] {
  if (!map) return 'bottom'
  const el = map.getContainer()
  const w = el.clientWidth
  const h = el.clientHeight
  const { x, y } = map.project([lng, lat])

  const fitsAbove = y - OVERLAY_TOP >= CARD_H
  const vertical = fitsAbove || y - OVERLAY_TOP >= h - y ? 'bottom' : 'top'

  // A centered card spans x ± CARD_W/2 (bounded by the container width so a card
  // wider than the viewport still resolves to a definite side). If that would
  // cross either edge, pin the nearer side to the marker so it opens inward.
  const half = Math.min(CARD_W, w - EDGE_MARGIN * 2) / 2
  let horizontal = ''
  if (x - half < EDGE_MARGIN) horizontal = '-left'
  else if (x + half > w - EDGE_MARGIN) horizontal = '-right'

  return `${vertical}${horizontal}` as PopupProps['anchor']
}

export default function MapListingPopup({ listingKey, longitude, latitude, onClose }: Props) {
  const router = useRouter()
  const { current: map } = useMap()
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
      // Only flip the heart once the write actually succeeds — toggling
      // unconditionally made a failed save look identical to a real one.
      toggleSaved(listingKey)
    } catch {
      // Leave state untouched; the click silently did nothing on the backend.
    }
  }

  const openDetail = () => router.push(`/properties/${listingKey}`)

  return (
    <Popup
      longitude={longitude}
      latitude={latitude}
      anchor={pickAnchor(map, longitude, latitude)}
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
        className="w-[256px] max-w-[calc(100vw-1.5rem)] cursor-pointer bg-white rounded-xl overflow-hidden font-ui text-left"
      >
        {/* Photo */}
        <div className="relative h-36 bg-[#F2F0EB]">
          {/* plain <img>: DDF photo hosts aren't whitelisted for next/image */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={data?.images?.[0] || FALLBACK_IMG}
            alt={data?.address || 'Listing'}
            className="w-full h-full object-cover object-left-top"
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
            <PropertyCell
              compact
              data={{
                price: data.price,
                address: data.address,
                location: data.city,
                beds: data.beds,
                baths: data.baths,
                sqft: data.sqft,
                propertyType: data.propertyType,
                brokerageName: data.brokerageName,
                mlsNumber: data.mlsNumber,
                realtorUrl: data.realtorUrl,
                listingKey: data.id,
              }}
            />
          )}
        </div>
      </div>
    </Popup>
  )
}
