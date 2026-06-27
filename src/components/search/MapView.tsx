'use client'

import { useCallback, useEffect, useRef } from 'react'
import Map, { Marker, NavigationControl } from 'react-map-gl/mapbox'
import type { MapRef, ViewStateChangeEvent } from 'react-map-gl/mapbox'
import 'mapbox-gl/dist/mapbox-gl.css'
import { useSearchStore } from '@/store/searchStore'
import type { Property, MapPinResponse } from '@/types/search'
import PricePin from './PricePin'
import MapListingPopup from './MapListingPopup'

interface MapViewProps {
  properties: Property[]
  /** All listings in the current viewport (up to 500) — drawn as pins,
   *  independent of the paginated list. Falls back to `properties` when empty. */
  pins?: MapPinResponse[]
  /** When this value changes (e.g. a new city search), the map flies to fit
   *  the returned results. Empty string = browsing, no auto-fit. */
  fitSignal?: string
}

interface MapMarker {
  id: string
  longitude: number
  latitude: number
  price: number | null
}

// Warm amber aerial style — Mapbox satellite-streets with a custom warm tint applied via CSS
const MAPBOX_STYLE = 'mapbox://styles/mapbox/light-v11'

export default function MapView({ properties, pins = [], fitSignal = '' }: MapViewProps) {
  const mapRef = useRef<MapRef>(null)
  const lastFitSignal = useRef<string | null>(null)
  const {
    mapCenter,
    setMapCenter,
    setMapBounds,
    hoveredPropertyId,
    setHoveredProperty,
    selectedPropertyId,
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

    // Fit to the bulk of the results, trimming geographic outliers (a single
    // stray listing far from the city would otherwise blow out the bounds and
    // leave the map zoomed too far out). Use the 5th–95th percentile of each axis.
    const pct = (sorted: number[], p: number) => {
      const idx = Math.min(sorted.length - 1, Math.max(0, Math.round((sorted.length - 1) * p)))
      return sorted[idx]
    }
    const lngs = valid.map((p) => p.longitude).sort((a, b) => a - b)
    const lats = valid.map((p) => p.latitude).sort((a, b) => a - b)
    const west = pct(lngs, 0.05)
    const east = pct(lngs, 0.95)
    const south = pct(lats, 0.05)
    const north = pct(lats, 0.95)

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

  // Prefer viewport pins (all listings in view); fall back to the current
  // list page's properties until the first pins load.
  const markers: MapMarker[] =
    pins.length > 0
      ? pins
          .filter((p) => p.lat != null && p.lng != null)
          .map((p) => ({ id: p.id, longitude: p.lng as number, latitude: p.lat as number, price: p.price }))
      : properties
          .filter((p) => p.latitude !== 0 || p.longitude !== 0)
          .map((p) => ({ id: p.id, longitude: p.longitude, latitude: p.latitude, price: p.price }))

  const selectedMarker = selectedPropertyId
    ? markers.find((m) => m.id === selectedPropertyId)
    : undefined

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
        onClick={() => setSelectedProperty(null)}
        style={{ width: '100%', height: '100%' }}
        // Apply warm amber effect via CSS filter on the map canvas
        attributionControl={false}
        reuseMaps
      >
        {/* Navigation controls */}
        <NavigationControl position="bottom-right" showCompass={false} />

        {/* Price pins — all listings in the viewport (up to 500) */}
        {markers.map((m) => (
          <Marker
            key={m.id}
            longitude={m.longitude}
            latitude={m.latitude}
            anchor="center"
            onClick={(e) => {
              e.originalEvent.stopPropagation()
              setSelectedProperty(m.id)
            }}
          >
            <PricePin
              price={m.price ?? 0}
              isActive={hoveredPropertyId === m.id || selectedPropertyId === m.id}
              onMouseEnter={() => setHoveredProperty(m.id)}
              onMouseLeave={() => setHoveredProperty(null)}
            />
          </Marker>
        ))}

        {/* Zillow-style listing card popup */}
        {selectedMarker && selectedPropertyId && (
          <MapListingPopup
            listingKey={selectedPropertyId}
            longitude={selectedMarker.longitude}
            latitude={selectedMarker.latitude}
            onClose={() => setSelectedProperty(null)}
          />
        )}
      </Map>

      {/* Warm sepia filter overlay on the map canvas (applied to canvas element) */}
      <style>{`
        .mapboxgl-canvas {
          filter: sepia(0.25) saturate(1.3) hue-rotate(-8deg) brightness(0.92);
        }
        /* Strip default mapbox popup chrome so the listing card fills it cleanly */
        .vicinus-map-popup .mapboxgl-popup-content {
          padding: 0;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 8px 28px rgba(0, 0, 0, 0.22);
        }
        .vicinus-map-popup .mapboxgl-popup-tip {
          border-top-color: #ffffff;
        }
      `}</style>
    </div>
  )
}
