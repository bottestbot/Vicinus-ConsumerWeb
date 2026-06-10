'use client'

import { useCallback, useEffect, useRef } from 'react'
import Map, { Marker, NavigationControl } from 'react-map-gl/mapbox'
import type { MapRef, ViewStateChangeEvent } from 'react-map-gl/mapbox'
import 'mapbox-gl/dist/mapbox-gl.css'
import { useSearchStore } from '@/store/searchStore'
import type { Property } from '@/types/search'
import PricePin from './PricePin'

interface MapViewProps {
  properties: Property[]
  /** When this value changes (e.g. a new city search), the map flies to fit
   *  the returned results. Empty string = browsing, no auto-fit. */
  fitSignal?: string
}

// Warm amber aerial style — Mapbox satellite-streets with a custom warm tint applied via CSS
const MAPBOX_STYLE = 'mapbox://styles/mapbox/light-v11'

export default function MapView({ properties, fitSignal = '' }: MapViewProps) {
  const mapRef = useRef<MapRef>(null)
  const lastFitSignal = useRef<string | null>(null)
  const {
    mapCenter,
    setMapCenter,
    setMapBounds,
    hoveredPropertyId,
    setHoveredProperty,
    setSelectedProperty,
  } = useSearchStore()

  // Recenter the map to the result set whenever a new text search runs.
  // Keyed on fitSignal so it fires once per search, not on map pans.
  useEffect(() => {
    if (!fitSignal || fitSignal === lastFitSignal.current) return
    const map = mapRef.current
    if (!map) return

    const valid = properties.filter((p) => p.latitude !== 0 || p.longitude !== 0)
    if (valid.length === 0) return

    lastFitSignal.current = fitSignal

    if (valid.length === 1) {
      map.flyTo({ center: [valid[0].longitude, valid[0].latitude], zoom: 13, duration: 1200 })
      return
    }

    let west = Infinity, south = Infinity, east = -Infinity, north = -Infinity
    for (const p of valid) {
      west = Math.min(west, p.longitude)
      east = Math.max(east, p.longitude)
      south = Math.min(south, p.latitude)
      north = Math.max(north, p.latitude)
    }
    map.fitBounds(
      [[west, south], [east, north]],
      { padding: 60, duration: 1200, maxZoom: 15 },
    )
  }, [fitSignal, properties])

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

  if (!token) {
    return (
      <div className="w-full h-full bg-[#1C2020] flex items-center justify-center">
        <p className="text-white/40 text-sm">Map unavailable — Mapbox token not configured</p>
      </div>
    )
  }

  return (
    <div className="relative w-full h-full overflow-hidden" style={{ minHeight: '500px' }}>
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

        {/* Price pins — FE-307: skip properties without valid coordinates */}
        {properties.filter((p) => p.latitude !== 0 || p.longitude !== 0).map((property) => (
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
