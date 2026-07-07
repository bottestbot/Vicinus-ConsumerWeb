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
