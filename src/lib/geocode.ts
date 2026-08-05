const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? ''

export interface AddressSuggestion {
  id: string
  label: string
  subtitle: string
}

// Forward-geocode partial street addresses for autocomplete (Sell valuation intro).
// Reuses the existing Mapbox token; `types=address` returns street-level matches
// like "759 Winona Ave" that the internal city/neighbourhood autocomplete does not.
export async function searchAddresses(query: string): Promise<AddressSuggestion[]> {
  if (!query.trim() || !MAPBOX_TOKEN) return []
  try {
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?country=ca&types=address&autocomplete=true&limit=5&access_token=${MAPBOX_TOKEN}`
    const res = await fetch(url)
    if (!res.ok) return []
    const json = await res.json()
    const features = (json.features ?? []) as Array<{
      id: string
      place_name?: string
      text?: string
      address?: string
      context?: Array<{ text?: string }>
    }>
    return features.map((f) => {
      const street = [f.address, f.text].filter(Boolean).join(' ')
      const region = (f.context ?? []).map((c) => c.text).filter(Boolean).slice(0, 2).join(', ')
      return {
        id: f.id,
        label: street || f.place_name || query,
        subtitle: region || f.place_name || '',
      }
    })
  } catch {
    return []
  }
}

// Reverse-geocode coords to a city name via Nominatim (no Mapbox token needed).
// Used by MapView, debounced on map pan, to label the area being browsed.
export async function reverseGeocodeCity(latitude: number, longitude: number): Promise<string | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
      { headers: { 'Accept-Language': 'en', 'User-Agent': 'Vicinus/1.0' } },
    )
    const json = await res.json()
    return json.address?.city || json.address?.town || json.address?.village || json.address?.county || null
  } catch {
    return null
  }
}

export async function geocodeCity(query: string): Promise<{ longitude: number; latitude: number } | null> {
  if (!query.trim() || !MAPBOX_TOKEN) return null
  try {
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?country=ca&types=place,neighborhood&limit=1&access_token=${MAPBOX_TOKEN}`
    const res = await fetch(url)
    if (!res.ok) return null
    const json = await res.json()
    const feature = json.features?.[0]
    if (!feature) return null
    const [longitude, latitude] = feature.center as [number, number]
    return { longitude, latitude }
  } catch {
    return null
  }
}

// Forward-geocode a full street address to coords (the precise-zoom half of the
// two-step address search: geocodeCity() gets the map moving instantly, this
// refines it once Mapbox resolves the exact point). `types=address` only, no
// autocomplete — this is for a single resolved query, not a suggestion list.
export async function geocodeAddress(query: string): Promise<{ longitude: number; latitude: number } | null> {
  if (!query.trim() || !MAPBOX_TOKEN) return null
  try {
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?country=ca&types=address&limit=1&access_token=${MAPBOX_TOKEN}`
    const res = await fetch(url)
    if (!res.ok) return null
    const json = await res.json()
    const feature = json.features?.[0]
    if (!feature) return null
    const [longitude, latitude] = feature.center as [number, number]
    return { longitude, latitude }
  } catch {
    return null
  }
}

export interface ParsedAddress {
  /** True when input looks like "<number> <street> ..." — a street address —
   *  rather than a bare city/neighbourhood/postal-code query. Doesn't require
   *  a comma before the city: Mapbox's forward geocoder tokenizes and
   *  fuzzy-matches the whole string regardless (verified against both
   *  "123 Hugh Street, Port Moody" and "123 Hugh Street Port Moody"), so
   *  geocodeCity()/geocodeAddress() are always called with the raw input —
   *  there's no need to split out the city ourselves. */
  isFullAddress: boolean
}

export function parseAddress(input: string): ParsedAddress {
  const firstSegment = input.split(',')[0]?.trim() ?? ''
  return { isFullAddress: /^\d+\s/.test(firstSegment) }
}
