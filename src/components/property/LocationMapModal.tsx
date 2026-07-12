'use client'

// In-page "View on map" popup — replaces redirecting to Google Maps in a new
// tab. Reuses the same Mapbox setup as NeighbourhoodMiniMap/ActivityMapInner.
import dynamic from 'next/dynamic'
import { X } from 'lucide-react'

const LocationMapModalInner = dynamic(() => import('./LocationMapModalInner'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-[#F2F0EB] animate-pulse flex items-center justify-center">
      <span className="text-[#6B6B6B] text-xs">Loading map…</span>
    </div>
  ),
})

interface LocationMapModalProps {
  latitude: number
  longitude: number
  address: string
  onClose: () => void
}

export default function LocationMapModal({ latitude, longitude, address, onClose }: LocationMapModalProps) {
  return (
    <div
      className="fixed inset-0 z-[150] flex items-end justify-center sm:items-center px-4 pb-4 sm:pb-0"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl z-10 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E8E6E1]">
          <h3 className="font-heading text-lg font-semibold text-[#111111]">Location</h3>
          <button onClick={onClose} className="text-[#6B6B6B] hover:text-[#111111]" aria-label="Close map">
            <X size={18} />
          </button>
        </div>
        <div className="h-[60vh] sm:h-[480px]">
          <LocationMapModalInner latitude={latitude} longitude={longitude} address={address} />
        </div>
      </div>
    </div>
  )
}
