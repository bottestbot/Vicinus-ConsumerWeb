const GOOGLE_PLACES_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY ?? ''

export async function getNeighbourhoodGooglePhotos(
  neighbourhoodName: string,
  city: string,
): Promise<string[]> {
  if (!GOOGLE_PLACES_API_KEY) return []

  try {
    const searchRes = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': GOOGLE_PLACES_API_KEY,
        'X-Goog-FieldMask': 'places.id,places.photos',
      },
      body: JSON.stringify({
        textQuery: `${neighbourhoodName} neighbourhood ${city} Canada`,
      }),
      next: { revalidate: 86400 },
    })
    if (!searchRes.ok) return []

    const searchData = await searchRes.json()
    const photos: Array<{ name: string }> = (searchData.places?.[0]?.photos ?? []).slice(0, 5)
    if (photos.length === 0) return []

    const photoUris = await Promise.all(
      photos.map(async (photo) => {
        try {
          const mediaRes = await fetch(
            `https://places.googleapis.com/v1/${photo.name}/media?maxHeightPx=800&maxWidthPx=1200&key=${GOOGLE_PLACES_API_KEY}&skipHttpRedirect=true`,
            { next: { revalidate: 86400 } },
          )
          if (!mediaRes.ok) return null
          const mediaData = await mediaRes.json()
          return (mediaData.photoUri as string) ?? null
        } catch {
          return null
        }
      }),
    )

    return photoUris.filter((uri): uri is string => uri !== null)
  } catch {
    return []
  }
}
