'use client'

import { useCallback, useRef } from 'react'
import Map, { Marker, NavigationControl } from 'react-map-gl/mapbox'
import type { MapRef, ViewStateChangeEvent } from 'react-map-gl/mapbox'
import 'mapbox-gl/dist/mapbox-gl.css'
import { useSearchStore } from '@/store/searchStore'
import type { Property } from '@/types/search'
import PricePin from './PricePin'

interface MapViewProps {
  properties: Property[]
}

// Warm amber aerial style — Mapbox satellite-streets with a custom warm tint applied via CSS
const MAPBOX_STYLE = 'mapbox://styles/mapbox/satellite-streets-v12'

export default function MapView({ properties }: MapViewProps) {
  const mapRef = useRef<MapRef>(null)
  const {
    mapCenter,
    setMapCenter,
    setMapBounds,
    hoveredPropertyId,
    setHoveredProperty,
    setSelectedProperty,
  } = useSearchStore()

  const handleMoveEnd = useCallback(
    (e: ViewStateChangeEvent) => {
      const map = mapRef.current
      if (!map) return

      const bounds = map.getBounds()
      if (bounds) {
        setMapBounds({
          west: bounds.getWest(),
          south: bounds.getSouth(),
          east: bounds.getEast(),
          north: bounds.getNorth(),
        })
      }

      setMapCenter({
        longitude: e.viewState.longitude,
        latitude: e.viewState.latitude,
        zoom: e.viewState.zoom,
      })
    },
    [setMapBounds, setMapCenter]
  )

  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? ''

  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Warm amber overlay — CSS filter on a pseudo-element for the amber tint */}
      <div
        className="absolute inset-0 pointer-events-none z-10 mix-blend-multiply"
        style={{ background: 'rgba(210, 140, 40, 0.08)' }}
        aria-hidden="true"
      />

      <Map
        ref={mapRef}
        mapboxAccessToken={token}
        mapStyle={MAPBOX_STYLE}
        initialViewState={{
          longitude: mapCenter.longitude,
          latitude: mapCenter.latitude,
          zoom: mapCenter.zoom,
        }}
        onMoveEnd={handleMoveEnd}
        style={{ width: '100%', height: '100%' }}
        // Apply warm amber effect via CSS filter on the map canvas
        attributionControl={false}
        reuseMaps
      >
        {/* Navigation controls */}
        <NavigationControl position="bottom-right" showCompass={false} />

        {/* Price pins — FE-307 */}
        {properties.map((property) => (
          <Marker
            key={property.id}
            longitude={property.longitude}
            latitude={property.latitude}
            anchor="center"
            onClick={(e) => {
              e.originalEvent.stopPropagation()
              setSelectedProperty(property.id)
            }}
          >
            <PricePin
              price={property.price}
              isActive={hoveredPropertyId === property.id}
              onMouseEnter={() => setHoveredProperty(property.id)}
              onMouseLeave={() => setHoveredProperty(null)}
            />
          </Marker>
        ))}
      </Map>

      {/* Warm sepia filter overlay on the map canvas (applied to canvas element) */}
      <style>{`
        .mapboxgl-canvas {
          filter: sepia(0.25) saturate(1.3) hue-rotate(-8deg) brightness(0.92);
        }
      `}</style>
    </div>
  )
}
