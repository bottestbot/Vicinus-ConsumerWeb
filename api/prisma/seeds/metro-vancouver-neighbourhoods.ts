/**
 * Seed the Neighbourhood table for Metro Vancouver.
 *
 * Granularity (per product decision):
 *  - City of Vancouver → its 22 official local planning areas (source: City of
 *    Vancouver Open Data "Local Area Boundary"). Browse/curation only for now —
 *    DDF listings cannot be auto-tagged to these because every Vancouver listing
 *    has City = "Vancouver" and a null CityRegion. Polygon point-in-polygon
 *    tagging is a later step.
 *  - Every other Metro Vancouver municipality → one area row whose `city` exactly
 *    matches the DDF `City` string, so listings tag 1:1 by city.
 *
 * Idempotent: upserts by unique slug, safe to re-run.
 *
 * Run:  npx ts-node prisma/seeds/metro-vancouver-neighbourhoods.ts
 */
import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? process.env.MAPBOX_TOKEN ?? ''

async function geocode(name: string, city: string): Promise<{ lat: number; lng: number } | null> {
  if (!MAPBOX_TOKEN) return null
  const q = encodeURIComponent(`${name} ${city} Canada`)
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

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) })

// City of Vancouver — 22 official local areas (verified against opendata.vancouver.ca).
const VANCOUVER_LOCAL_AREAS = [
  'Arbutus Ridge',
  'Downtown',
  'Dunbar-Southlands',
  'Fairview',
  'Grandview-Woodland',
  'Hastings-Sunrise',
  'Kensington-Cedar Cottage',
  'Kerrisdale',
  'Killarney',
  'Kitsilano',
  'Marpole',
  'Mount Pleasant',
  'Oakridge',
  'Renfrew-Collingwood',
  'Riley Park',
  'Shaughnessy',
  'South Cambie',
  'Strathcona',
  'Sunset',
  'Victoria-Fraserview',
  'West End',
  'West Point Grey',
]

// Metro Vancouver member municipalities (excluding the City of Vancouver, which is
// represented by its local areas above). `city` matches the DDF City string exactly.
const METRO_MUNICIPALITIES = [
  'Anmore',
  'Belcarra',
  'Bowen Island',
  'Burnaby',
  'Coquitlam',
  'Delta',
  'Langley',
  'Lions Bay',
  'Maple Ridge',
  'New Westminster',
  'North Vancouver',
  'Pitt Meadows',
  'Port Coquitlam',
  'Port Moody',
  'Richmond',
  'Surrey',
  'Tsawwassen',
  'West Vancouver',
  'White Rock',
]

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[.']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

async function main() {
  const rows: { name: string; slug: string; city: string; province: string }[] = []

  for (const name of VANCOUVER_LOCAL_AREAS) {
    rows.push({ name, slug: slugify(name), city: 'Vancouver', province: 'BC' })
  }
  for (const name of METRO_MUNICIPALITIES) {
    // Distinct slug from any same-named Vancouver area (none collide today, but
    // prefix municipalities for safety and to keep the two tiers separable).
    rows.push({ name, slug: slugify(name), city: name, province: 'BC' })
  }

  if (!MAPBOX_TOKEN) {
    console.log('No Mapbox token — skipping geocoding. Run backfill-neighbourhood-coords.ts later.')
  }

  let created = 0
  let updated = 0
  for (const r of rows) {
    const existing = await prisma.neighbourhood.findUnique({ where: { slug: r.slug } })
    const coords = existing?.lat == null ? await geocode(r.name, r.city) : null
    await prisma.neighbourhood.upsert({
      where: { slug: r.slug },
      create: { ...r, lat: coords?.lat, lng: coords?.lng },
      update: { name: r.name, city: r.city, province: r.province, ...(coords ? { lat: coords.lat, lng: coords.lng } : {}) },
    })
    existing ? updated++ : created++
    if (coords) await new Promise((res) => setTimeout(res, 110))
  }

  console.log(
    `Metro Vancouver seed complete: ${created} created, ${updated} updated ` +
      `(${VANCOUVER_LOCAL_AREAS.length} Vancouver local areas + ${METRO_MUNICIPALITIES.length} municipalities).`,
  )
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
