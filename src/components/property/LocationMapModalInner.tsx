'use client'

// Interactive Mapbox map rendered inside LocationMapModal. Always loaded via
// dynamic import (ssr: false) from LocationMapModal — Mapbox needs the DOM.
import Map, { Marker, NavigationControl } from 'react-map-gl/mapbox'
import 'mapbox-gl/dist/mapbox-gl.css'
import { MapPin } from 'lucide-react'

interface LocationMapModalInnerProps {
  latitude: number
  longitude: number
  address: string
}

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? ''

export default function LocationMapModalInner({ latitude, longitude, address }: LocationMapModalInnerProps) {
  if (!MAPBOX_TOKEN) {
    return (
      <div className="w-full h-full bg-gradient-to-br from-[#E8E6E1] to-[#CECAB8] flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 rounded-full bg-[#1C3829] flex items-center justify-center shadow-lg">
          <MapPin size={18} className="text-white" />
        </div>
        <p className="text-sm text-[#6B6B6B]">Map preview unavailable</p>
      </div>
    )
  }

  return (
    <div className="relative w-full h-full">
      <Map
        mapboxAccessToken={MAPBOX_TOKEN}
        initialViewState={{ latitude, longitude, zoom: 15 }}
        style={{ width: '100%', height: '100%' }}
        mapStyle="mapbox://styles/mapbox/light-v11"
        attributionControl={false}
      >
        <NavigationControl position="top-right" showCompass={false} />
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
      <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-sm rounded-lg px-3 py-1.5 shadow-sm max-w-[80%]">
        <p className="text-xs font-medium text-[#111111] truncate">{address}</p>
      </div>
    </div>
  )
}
