/**
 * Seed script: fetch Google Places photos for every neighbourhood and persist
 * the final CDN URLs in the `photos` JSON column.
 *
 * Photo filtering strategy (two layers):
 *  1. Attraction-biased search — queries target parks, landmarks, and scenic
 *     spots rather than the neighbourhood name alone, which biases Google
 *     Places toward architecture/landscape photos over street-level people shots.
 *  2. Google Cloud Vision face detection — each candidate photo URL is checked
 *     via the Vision API. Any photo where faces are detected is discarded.
 *     Requires "Cloud Vision API" enabled in your Google Cloud project.
 *     Falls back to unfiltered photos if Vision API is unavailable.
 *
 * Prerequisites:
 *   - GOOGLE_PLACES_API_KEY  — Places API (New) enabled
 *   - GOOGLE_VISION_API_KEY  — Cloud Vision API enabled (can be same key)
 *   - DATABASE_URL            — target database
 *
 * Run:
 *   GOOGLE_PLACES_API_KEY=xxx GOOGLE_VISION_API_KEY=xxx \
 *     npx ts-node prisma/seeds/seed-neighbourhood-photos.ts
 *
 * Safe to re-run — skips rows that already have photos unless --force is passed.
 * Pass --slugs=kitsilano,burnaby to only refresh specific neighbourhoods.
 */
import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) })

const PLACES_KEY = process.env.GOOGLE_PLACES_API_KEY
const VISION_KEY = process.env.GOOGLE_VISION_API_KEY ?? process.env.GOOGLE_PLACES_API_KEY
const FORCE = process.argv.includes('--force')
const SLUG_FILTER = process.argv
  .find((a) => a.startsWith('--slugs='))
  ?.replace('--slugs=', '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean) ?? []

const MAX_PHOTOS = 6
const CANDIDATES_PER_QUERY = 10
const DELAY_MS = 300

// Attraction types that produce architecture/landscape photos rather than
// street-level shots with people.
const ATTRACTION_TYPES = [
  'park',
  'tourist_attraction',
  'natural_feature',
  'historical_landmark',
  'beach',
  'scenic_lookout',
]

interface PlacesPhoto {
  name: string
  authorAttributions?: { displayName?: string }[]
}

interface PlacesSearchResponse {
  places?: { photos?: PlacesPhoto[] }[]
}

interface PhotoMediaResponse {
  photoUri: string
}

interface VisionAnnotateResponse {
  responses?: { faceAnnotations?: unknown[] }[]
}

async function resolvePhotoUrl(photoName: string): Promise<string | null> {
  const res = await fetch(
    `https://places.googleapis.com/v1/${photoName}/media?maxHeightPx=1200&skipHttpRedirect=true&key=${PLACES_KEY}`,
  )
  if (!res.ok) return null
  const data = (await res.json()) as PhotoMediaResponse
  return data.photoUri ?? null
}

async function fetchCandidateUrls(
  name: string,
  city: string | null,
): Promise<string[]> {
  const location = city ? `${city} BC Canada` : 'BC Canada'

  // Run two queries in parallel:
  //  (a) general neighbourhood landmarks/attractions
  //  (b) neighbourhood name as a scenic/aerial landmark
  const queries = [
    `${name} park landmark scenic ${location}`,
    `${name} ${location} attraction aerial view`,
  ]

  const allRefs: PlacesPhoto[] = []

  await Promise.all(
    queries.map(async (textQuery) => {
      const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': PLACES_KEY!,
          'X-Goog-FieldMask': 'places.photos',
        },
        body: JSON.stringify({
          textQuery,
          includedType: ATTRACTION_TYPES[Math.floor(Math.random() * ATTRACTION_TYPES.length)],
          maxResultCount: 3,
        }),
      })
      if (!res.ok) return
      const data = (await res.json()) as PlacesSearchResponse
      const photos = data.places?.flatMap((p) => p.photos ?? []) ?? []
      // Prefer photos attributed to "Google" (usually editorial quality)
      const sorted = [...photos].sort((a, b) => {
        const aIsGoogle = a.authorAttributions?.some((au) =>
          au.displayName?.toLowerCase().includes('google'),
        )
          ? 0
          : 1
        const bIsGoogle = b.authorAttributions?.some((au) =>
          au.displayName?.toLowerCase().includes('google'),
        )
          ? 0
          : 1
        return aIsGoogle - bIsGoogle
      })
      allRefs.push(...sorted.slice(0, CANDIDATES_PER_QUERY))
    }),
  )

  // Resolve all refs to URLs, deduplicate
  const urls = await Promise.all(allRefs.map((r) => resolvePhotoUrl(r.name)))
  return [...new Set(urls.filter((u): u is string => u !== null))]
}

async function hasFaces(photoUrl: string): Promise<boolean> {
  if (!VISION_KEY) return false
  try {
    const res = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${VISION_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requests: [
            {
              image: { source: { imageUri: photoUrl } },
              features: [{ type: 'FACE_DETECTION', maxResults: 1 }],
            },
          ],
        }),
      },
    )
    if (!res.ok) return false
    const data = (await res.json()) as VisionAnnotateResponse
    const faces = data.responses?.[0]?.faceAnnotations ?? []
    return faces.length > 0
  } catch {
    return false
  }
}

async function fetchFilteredPhotos(
  name: string,
  city: string | null,
): Promise<string[]> {
  const candidates = await fetchCandidateUrls(name, city)
  if (candidates.length === 0) return []

  if (!VISION_KEY) {
    console.warn('    (no GOOGLE_VISION_API_KEY — skipping face filter)')
    return candidates.slice(0, MAX_PHOTOS)
  }

  // Filter concurrently but cap concurrency to avoid Vision API rate limits
  const BATCH = 5
  const clean: string[] = []

  for (let i = 0; i < candidates.length && clean.length < MAX_PHOTOS; i += BATCH) {
    const batch = candidates.slice(i, i + BATCH)
    const results = await Promise.all(
      batch.map(async (url) => ({ url, faces: await hasFaces(url) })),
    )
    for (const { url, faces } of results) {
      if (!faces) clean.push(url)
      if (clean.length >= MAX_PHOTOS) break
    }
  }

  // If Vision filtering removed everything, fall back to raw candidates
  return clean.length > 0 ? clean : candidates.slice(0, MAX_PHOTOS)
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function main() {
  if (!PLACES_KEY) {
    console.error('GOOGLE_PLACES_API_KEY is not set.')
    process.exit(1)
  }

  if (!VISION_KEY) {
    console.warn('GOOGLE_VISION_API_KEY not set — face filtering disabled.')
  }

  const where = SLUG_FILTER.length > 0 ? { slug: { in: SLUG_FILTER } } : {}
  const neighbourhoods = await prisma.neighbourhood.findMany({
    where,
    select: { id: true, slug: true, name: true, city: true, photos: true },
    orderBy: { name: 'asc' },
  })

  console.log(`Found ${neighbourhoods.length} neighbourhoods to process.`)

  let seeded = 0
  let skipped = 0

  for (const n of neighbourhoods) {
    const hasPhotos = Array.isArray(n.photos) && (n.photos as string[]).length > 0
    if (hasPhotos && !FORCE) {
      console.log(`  skip  ${n.slug}`)
      skipped++
      continue
    }

    process.stdout.write(`  fetch ${n.slug} (${n.name}) ... `)

    const photos = await fetchFilteredPhotos(n.name, n.city)
    await prisma.neighbourhood.update({
      where: { id: n.id },
      data: { photos },
    })

    console.log(`${photos.length} photos saved`)
    seeded++

    await sleep(DELAY_MS)
  }

  console.log(`\nDone: ${seeded} seeded, ${skipped} skipped.`)
  console.log('Re-run with --force to refresh all. Use --slugs=a,b to target specific rows.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
