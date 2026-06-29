const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? ''

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
