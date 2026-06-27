/**
 * Targeted fix: patch neighbourhoods that got 0 or very few photos
 * from the main seed, using alternative Google Places queries.
 *
 * Run:
 *   GOOGLE_PLACES_API_KEY=xxx npx ts-node prisma/seeds/seed-neighbourhood-photos-fix.ts
 */
import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) })

const GOOGLE_KEY = process.env.GOOGLE_PLACES_API_KEY
const MAX_PHOTOS = 6

// Alternative queries for neighbourhoods with poor/no results
const OVERRIDES: Record<string, string[]> = {
  'downtown':            ['Downtown Vancouver BC', 'Gastown Vancouver BC', 'Vancouver City Centre BC'],
  'grandview-woodland':  ['Commercial Drive Vancouver BC', 'Grandview Vancouver BC'],
  'kensington-cedar-cottage': ['Kensington Park Vancouver BC', 'Cedar Cottage Vancouver BC', 'Kensington Vancouver BC'],
  'south-cambie':        ['Cambie Village Vancouver BC', 'Queen Elizabeth Park Vancouver BC'],
  'sunset':              ['Sunset Community Centre Vancouver BC', 'Fraser Street Vancouver BC'],
  'victoria-fraserview': ['Victoria Drive Vancouver BC', 'Fraserview Vancouver BC'],
  'coquitlam':           ['Coquitlam BC Canada', 'Coquitlam Centre BC'],
  'killarney':           ['Killarney Park Vancouver BC', 'Killarney Community Centre Vancouver BC'],
}

interface PlacesSearchResponse {
  places?: { photos?: { name: string }[] }[]
}
interface PhotoMediaResponse {
  photoUri: string
}

async function fetchPlacePhotos(query: string): Promise<string[]> {
  const searchRes = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': GOOGLE_KEY!,
      'X-Goog-FieldMask': 'places.photos',
    },
    body: JSON.stringify({ textQuery: query }),
  })

  if (!searchRes.ok) {
    const body = await searchRes.text()
    console.warn(`  search error ${searchRes.status}: ${body}`)
    return []
  }

  const searchData = (await searchRes.json()) as PlacesSearchResponse
  const photoRefs = searchData.places?.[0]?.photos?.slice(0, MAX_PHOTOS) ?? []
  if (photoRefs.length === 0) return []

  const urls: string[] = []
  for (const photo of photoRefs) {
    const mediaRes = await fetch(
      `https://places.googleapis.com/v1/${photo.name}/media?maxHeightPx=1200&skipHttpRedirect=true&key=${GOOGLE_KEY}`,
    )
    if (!mediaRes.ok) continue
    const mediaData = (await mediaRes.json()) as PhotoMediaResponse
    if (mediaData.photoUri) urls.push(mediaData.photoUri)
  }
  return urls
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function main() {
  if (!GOOGLE_KEY) {
    console.error('GOOGLE_PLACES_API_KEY is not set.')
    process.exit(1)
  }

  const slugs = Object.keys(OVERRIDES)
  const neighbourhoods = await prisma.neighbourhood.findMany({
    where: { slug: { in: slugs } },
    select: { id: true, slug: true, name: true, photos: true },
  })

  console.log(`Fixing ${neighbourhoods.length} neighbourhoods...\n`)

  for (const n of neighbourhoods) {
    const queries = OVERRIDES[n.slug]
    let photos: string[] = []

    for (const query of queries) {
      process.stdout.write(`  ${n.slug} — "${query}" ... `)
      photos = await fetchPlacePhotos(query)
      console.log(`${photos.length} photos`)
      if (photos.length >= 4) break
      await sleep(200)
    }

    await prisma.neighbourhood.update({
      where: { id: n.id },
      data: { photos },
    })
    console.log(`  => saved ${photos.length} photos for ${n.slug}\n`)
    await sleep(200)
  }

  console.log('Done.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
