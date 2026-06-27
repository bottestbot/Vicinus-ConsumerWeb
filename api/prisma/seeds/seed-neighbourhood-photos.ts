/**
 * One-time script: fetch Google Places photos for every neighbourhood
 * and persist the final CDN URLs in the `photos` JSON column.
 *
 * Prerequisites:
 *   - GOOGLE_PLACES_API_KEY in environment (or .env in this directory)
 *     Enable "Places API (New)" in Google Cloud Console
 *   - DATABASE_URL pointing at the target database
 *
 * Run:
 *   GOOGLE_PLACES_API_KEY=xxx npx ts-node prisma/seeds/seed-neighbourhood-photos.ts
 *
 * Safe to re-run — skips rows that already have photos unless --force is passed.
 */
import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) })

const GOOGLE_KEY = process.env.GOOGLE_PLACES_API_KEY
const FORCE = process.argv.includes('--force')
const MAX_PHOTOS = 6
const DELAY_MS = 200

interface PlacesSearchResponse {
  places?: { photos?: { name: string }[] }[]
}

interface PhotoMediaResponse {
  photoUri: string
}

async function fetchPlacePhotos(query: string): Promise<string[]> {
  // Step 1: text search to get photo references for the top result
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
    console.warn(`  Places search error ${searchRes.status} for "${query}": ${body}`)
    return []
  }

  const searchData = (await searchRes.json()) as PlacesSearchResponse
  const photoRefs = searchData.places?.[0]?.photos?.slice(0, MAX_PHOTOS) ?? []

  if (photoRefs.length === 0) return []

  // Step 2: resolve each photo reference to a permanent CDN URL
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

  const neighbourhoods = await prisma.neighbourhood.findMany({
    select: { id: true, slug: true, name: true, city: true, photos: true },
    orderBy: { name: 'asc' },
  })

  console.log(`Found ${neighbourhoods.length} neighbourhoods.`)

  let seeded = 0
  let skipped = 0

  for (const n of neighbourhoods) {
    const hasPhotos = Array.isArray(n.photos) && (n.photos as string[]).length > 0
    if (hasPhotos && !FORCE) {
      console.log(`  skip  ${n.slug} (already has photos)`)
      skipped++
      continue
    }

    const query = n.city
      ? `${n.name} neighbourhood ${n.city} BC Canada`
      : `${n.name} neighbourhood BC Canada`
    process.stdout.write(`  fetch ${n.slug} — "${query}" ... `)

    const photos = await fetchPlacePhotos(query)
    await prisma.neighbourhood.update({
      where: { id: n.id },
      data: { photos },
    })

    console.log(`${photos.length} photos saved`)
    seeded++

    await sleep(DELAY_MS)
  }

  console.log(`\nDone: ${seeded} seeded, ${skipped} skipped.`)
  console.log('Re-run with --force to refresh all photos.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
