'use client'

// PDP-04: PropertyLocationLinks — Street View + "view on map" affordances.
// "View on map" opens an in-page popup (reuses the app's own Mapbox setup)
// instead of redirecting to Google Maps in a new tab. Street View still
// redirects externally for now — an in-page embed needs the Google Maps
// Street View API, which isn't wired up yet (pending an API key).
import { useState } from 'react'
import { Navigation, MapPin } from 'lucide-react'
import LocationMapModal from './LocationMapModal'

interface PropertyLocationLinksProps {
  latitude: number
  longitude: number
  address: string
}

export default function PropertyLocationLinks({
  latitude,
  longitude,
  address,
}: PropertyLocationLinksProps) {
  const [mapOpen, setMapOpen] = useState(false)
  const hasCoords = Number.isFinite(latitude) && Number.isFinite(longitude) && (latitude !== 0 || longitude !== 0)
  const query = hasCoords ? `${latitude},${longitude}` : encodeURIComponent(address)

  // Nothing to link to.
  if (!hasCoords && !address) return null

  const streetViewUrl = hasCoords
    ? `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${latitude},${longitude}`
    : `https://www.google.com/maps/search/?api=1&query=${query}`
  // Fallback for the rare case we have no coordinates to plot on our own map —
  // an address-only Google search is still better than nothing.
  const mapFallbackUrl = `https://www.google.com/maps/search/?api=1&query=${query}`

  const base =
    'inline-flex items-center gap-2 rounded-full border border-[#E8E6E1] bg-white px-4 py-2 text-sm font-medium text-[#111111] hover:border-[#1C3829] hover:text-[#1C3829] transition-colors'

  return (
    <>
      <div className="flex flex-wrap gap-3">
        <a href={streetViewUrl} target="_blank" rel="noopener noreferrer" className={base}>
          <Navigation size={15} />
          Street View
        </a>
        {hasCoords ? (
          <button onClick={() => setMapOpen(true)} className={base}>
            <MapPin size={15} />
            View on map
          </button>
        ) : (
          <a href={mapFallbackUrl} target="_blank" rel="noopener noreferrer" className={base}>
            <MapPin size={15} />
            View on map
          </a>
        )}
      </div>

      {mapOpen && (
        <LocationMapModal
          latitude={latitude}
          longitude={longitude}
          address={address}
          onClose={() => setMapOpen(false)}
        />
      )}
    </>
  )
}
