const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? ''

export function getNeighbourhoodMapImageUrl(lat: number, lng: number): string {
  return `https://api.mapbox.com/styles/v1/mapbox/light-v11/static/${lng},${lat},13,0/1200x400?access_token=${MAPBOX_TOKEN}`
}

export async function geocodeNeighbourhood(
  name: string,
  city: string,
): Promise<{ lat: number; lng: number } | null> {
  if (!MAPBOX_TOKEN) return null
  try {
    const query = encodeURIComponent(`${name} ${city} Canada`)
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${query}.json?country=CA&types=neighborhood,place&limit=1&access_token=${MAPBOX_TOKEN}`
    const res = await fetch(url, { next: { revalidate: 86400 } })
    if (!res.ok) return null
    const data = await res.json()
    const [lng, lat] = data?.features?.[0]?.geometry?.coordinates ?? []
    if (lat == null || lng == null) return null
    return { lat, lng }
  } catch {
    return null
  }
}
