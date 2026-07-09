// PDP-04: PropertyLocationLinks — Street View + "view on map" affordances.
// Uses the listing coordinates (falls back to the address when coords are 0/absent)
// to deep-link into Google Street View and Google Maps in a new tab.
import { Navigation, MapPin } from 'lucide-react'

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
  const hasCoords = Number.isFinite(latitude) && Number.isFinite(longitude) && (latitude !== 0 || longitude !== 0)
  const query = hasCoords ? `${latitude},${longitude}` : encodeURIComponent(address)

  // Nothing to link to.
  if (!hasCoords && !address) return null

  const streetViewUrl = hasCoords
    ? `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${latitude},${longitude}`
    : `https://www.google.com/maps/search/?api=1&query=${query}`
  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${query}`

  const base =
    'inline-flex items-center gap-2 rounded-full border border-[#E8E6E1] bg-white px-4 py-2 text-sm font-medium text-[#111111] hover:border-[#1C3829] hover:text-[#1C3829] transition-colors'

  return (
    <div className="flex flex-wrap gap-3">
      <a href={streetViewUrl} target="_blank" rel="noopener noreferrer" className={base}>
        <Navigation size={15} />
        Street View
      </a>
      <a href={mapUrl} target="_blank" rel="noopener noreferrer" className={base}>
        <MapPin size={15} />
        View on map
      </a>
    </div>
  )
}
