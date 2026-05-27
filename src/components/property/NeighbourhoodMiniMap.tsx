'use client'

// Non-interactive mini map for neighbourhood context
// This file is always loaded via dynamic import (ssr: false) from NeighbourhoodContextScore
import Map, { Marker } from 'react-map-gl/mapbox'
import 'mapbox-gl/dist/mapbox-gl.css'
import { MapPin } from 'lucide-react'

interface NeighbourhoodMiniMapProps {
  latitude: number
  longitude: number
  address: string
}

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? ''

function StaticPlaceholder({ address }: { address: string }) {
  return (
    <div className="w-full h-full bg-gradient-to-br from-[#E8E6E1] to-[#CECAB8] flex flex-col items-center justify-center gap-3">
      <div className="w-10 h-10 rounded-full bg-[#1C3829] flex items-center justify-center shadow-lg">
        <MapPin size={18} className="text-white" />
      </div>
      <div className="text-center px-4">
        <p className="text-xs font-semibold text-[#111111] truncate max-w-[180px]">{address}</p>
        <p className="text-[10px] text-[#6B6B6B] mt-0.5">Map preview unavailable</p>
      </div>
    </div>
  )
}

export default function NeighbourhoodMiniMap({
  latitude,
  longitude,
  address,
}: NeighbourhoodMiniMapProps) {
  if (!MAPBOX_TOKEN) {
    return <StaticPlaceholder address={address} />
  }

  return (
    <Map
      mapboxAccessToken={MAPBOX_TOKEN}
      initialViewState={{ latitude, longitude, zoom: 14 }}
      style={{ width: '100%', height: '100%' }}
      mapStyle="mapbox://styles/mapbox/light-v11"
      interactive={false}
      attributionControl={false}
    >
      <Marker latitude={latitude} longitude={longitude} anchor="bottom">
        <div className="flex flex-col items-center">
          <div className="bg-[#1C3829] text-white rounded-full p-1.5 shadow-md">
            <MapPin size={14} />
          </div>
          <div className="w-0.5 h-2 bg-[#1C3829]" />
          <div className="w-1.5 h-1.5 bg-[#1C3829] rounded-full" />
        </div>
      </Marker>
    </Map>
  )
}
