/**
 * One-time script: fetch Unsplash lifestyle photos for every neighbourhood
 * and persist the URLs in the `photos` JSON column.
 *
 * Prerequisites:
 *   - UNSPLASH_ACCESS_KEY in environment (or .env in this directory)
 *     Get a free key at https://unsplash.com/developers
 *   - DATABASE_URL pointing at the target database
 *
 * Run:
 *   UNSPLASH_ACCESS_KEY=xxx npx ts-node prisma/seeds/seed-neighbourhood-photos.ts
 *
 * Safe to re-run — skips rows that already have photos unless --force is passed.
 */
import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) })

const UNSPLASH_KEY = process.env.UNSPLASH_ACCESS_KEY
const FORCE = process.argv.includes('--force')
const PER_PAGE = 6
const DELAY_MS = 300 // stay within Unsplash demo rate limit (50 req/hr)

async function fetchPhotos(query: string): Promise<string[]> {
  const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=${PER_PAGE}&orientation=landscape&client_id=${UNSPLASH_KEY}`
  const res = await fetch(url)
  if (!res.ok) {
    console.warn(`  Unsplash error ${res.status} for "${query}"`)
    return []
  }
  const data = (await res.json()) as { results: { urls: { regular: string } }[] }
  return data.results.map((r) => r.urls.regular)
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function main() {
  if (!UNSPLASH_KEY) {
    console.error('UNSPLASH_ACCESS_KEY is not set. Get a free key at https://unsplash.com/developers')
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

    const query = n.city ? `${n.name} ${n.city}` : n.name
    process.stdout.write(`  fetch ${n.slug} — "${query}" ... `)

    const photos = await fetchPhotos(query)
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
