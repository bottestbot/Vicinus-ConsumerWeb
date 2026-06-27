import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env' })
dotenv.config({ path: '../.env.local', override: false })

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? process.env.MAPBOX_TOKEN ?? ''

async function geocode(name: string, city: string | null): Promise<{ lat: number; lng: number } | null> {
  if (!MAPBOX_TOKEN) return null
  const q = encodeURIComponent(`${name} ${city ?? ''} Canada`.trim())
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${q}.json?country=CA&types=neighborhood,place&limit=1&access_token=${MAPBOX_TOKEN}`
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    const data = await res.json() as { features?: Array<{ geometry?: { coordinates?: [number, number] } }> }
    const coords = data.features?.[0]?.geometry?.coordinates
    if (!coords) return null
    const [lng, lat] = coords
    return { lat, lng }
  } catch {
    return null
  }
}

async function main() {
  if (!MAPBOX_TOKEN) {
    console.error('No Mapbox token found. Set NEXT_PUBLIC_MAPBOX_TOKEN or MAPBOX_TOKEN.')
    process.exit(1)
  }

  const rows = await prisma.neighbourhood.findMany({
    where: { lat: null },
    select: { id: true, name: true, city: true },
  })

  console.log(`Found ${rows.length} neighbourhood(s) with no coordinates.`)

  let updated = 0
  let failed = 0

  for (const row of rows) {
    const coords = await geocode(row.name, row.city)
    if (!coords) {
      console.log(`  SKIP  ${row.name} (no geocode result)`)
      failed++
      continue
    }
    await prisma.neighbourhood.update({
      where: { id: row.id },
      data: { lat: coords.lat, lng: coords.lng },
    })
    console.log(`  OK    ${row.name} → ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`)
    updated++
    // Respect Mapbox free-tier rate limit (600 req/min)
    await new Promise((r) => setTimeout(r, 110))
  }

  console.log(`\nDone: ${updated} updated, ${failed} skipped.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
