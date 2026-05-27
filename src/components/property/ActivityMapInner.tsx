'use client'

// Inner map component — separated so it can be dynamically imported
import { useState } from 'react'
import Image from 'next/image'
import Map, { Marker, Popup } from 'react-map-gl/mapbox'
import 'mapbox-gl/dist/mapbox-gl.css'
import type { NearbyListing } from '@/types/property'
import { formatPrice, formatFullPrice } from '@/types/search'
import { MapPin } from 'lucide-react'

interface ActivityMapInnerProps {
  latitude: number
  longitude: number
  address: string
  currentPrice: number
  nearbyListings: NearbyListing[]
}

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? ''

// ── Fallback when no Mapbox token ───────────────────────────────────────────
function NoTokenPlaceholder({
  address,
  currentPrice,
  nearbyListings,
}: Pick<ActivityMapInnerProps, 'address' | 'currentPrice' | 'nearbyListings'>) {
  return (
    <div className="w-full h-full bg-[#1C2020] flex flex-col items-center justify-center gap-4 p-6">
      <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
        <MapPin size={20} className="text-white/60" />
      </div>
      <div className="text-center">
        <p className="text-white font-semibold text-sm">{address}</p>
        <p className="text-white/40 text-xs mt-1">Listed at {formatFullPrice(currentPrice)}</p>
      </div>
      {nearbyListings.length > 0 && (
        <div className="flex flex-wrap justify-center gap-2 max-w-xs">
          {nearbyListings.map((l) => (
            <span
              key={l.id}
              className="bg-white text-[#111111] text-xs font-bold px-2.5 py-1 rounded-full"
            >
              {formatPrice(l.price)}
            </span>
          ))}
        </div>
      )}
      <p className="text-white/30 text-[10px]">
        Map preview · {nearbyListings.length} nearby listings
      </p>
    </div>
  )
}

function PricePin({
  price,
  isCurrent,
  onClick,
}: {
  price: number
  isCurrent?: boolean
  onClick?: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={[
        'px-2.5 py-1 rounded-full text-xs font-bold shadow-lg border-2 transition-all hover:scale-105',
        isCurrent
          ? 'bg-[#1C3829] text-white border-white'
          : 'bg-white text-[#111111] border-[#E8E6E1] hover:border-[#1C3829]',
      ].join(' ')}
    >
      {formatPrice(price)}
    </button>
  )
}

export default function ActivityMapInner({
  latitude,
  longitude,
  address,
  currentPrice,
  nearbyListings,
}: ActivityMapInnerProps) {
  const [selectedListing, setSelectedListing] = useState<NearbyListing | null>(null)

  if (!MAPBOX_TOKEN) {
    return (
      <NoTokenPlaceholder
        address={address}
        currentPrice={currentPrice}
        nearbyListings={nearbyListings}
      />
    )
  }

  return (
    <Map
      mapboxAccessToken={MAPBOX_TOKEN}
      initialViewState={{ latitude, longitude, zoom: 14 }}
      style={{ width: '100%', height: '100%' }}
      mapStyle="mapbox://styles/mapbox/dark-v11"
      attributionControl={false}
    >
      {/* Current property pin */}
      <Marker latitude={latitude} longitude={longitude} anchor="center">
        <PricePin price={currentPrice} isCurrent />
      </Marker>

      {/* Nearby listing pins */}
      {nearbyListings.map((listing) => (
        <Marker
          key={listing.id}
          latitude={listing.latitude}
          longitude={listing.longitude}
          anchor="center"
        >
          <PricePin
            price={listing.price}
            onClick={() =>
              setSelectedListing((prev) => (prev?.id === listing.id ? null : listing))
            }
          />
        </Marker>
      ))}

      {/* Popup for selected nearby listing */}
      {selectedListing && (
        <Popup
          latitude={selectedListing.latitude}
          longitude={selectedListing.longitude}
          anchor="bottom"
          onClose={() => setSelectedListing(null)}
          closeButton={false}
          offset={20}
          className="z-50"
        >
          <div className="w-52 bg-white rounded-xl overflow-hidden shadow-xl border border-[#E8E6E1] text-[#111111]">
            <div className="relative h-28">
              <Image
                src={selectedListing.imageUrl}
                alt={selectedListing.address}
                fill
                sizes="208px"
                className="object-cover"
              />
            </div>
            <div className="p-3">
              <p className="font-semibold text-sm">{formatPrice(selectedListing.price)}</p>
              <p className="text-xs text-[#6B6B6B] truncate">{selectedListing.address}</p>
              <p className="text-[10px] text-[#6B6B6B] mt-1">
                {selectedListing.beds} bd · {selectedListing.baths} ba · {selectedListing.sqft.toLocaleString()} sqft
              </p>
            </div>
          </div>
        </Popup>
      )}
    </Map>
  )
}
