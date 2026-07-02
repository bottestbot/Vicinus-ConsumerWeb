/**
 * Seed the Neighbourhood table for British Columbia from the authoritative
 * municipality/neighbourhood list (bc_municipalities_neighbourhoods.csv).
 *
 * The table backs two consumers:
 *   1. The /neighbourhoods index — browses genuine sub-area neighbourhoods
 *      (rows where name !== city).
 *   2. The /search/autocomplete dropdown — needs a city row per municipality
 *      (rows where name === city) so every city is searchable.
 *
 * So this seed writes, from 382 CSV rows:
 *   - One CITY row per distinct municipality (name === city). Municipal
 *     variants "Langley (City)"/"Langley (District)" (and North Vancouver) are
 *     merged to their base city name.
 *   - One NEIGHBOURHOOD row per genuine sub-area (name !== municipality), with
 *     a `${name}-${city}` slug so duplicate names (18 cities have a "Downtown")
 *     don't collide.
 *
 * Non-destructive: neighbourhoods for cities already seeded elsewhere with
 * bare-name slugs (Vancouver — see metro-vancouver-neighbourhoods.ts) are
 * skipped to avoid duplicate rows. Idempotent: upserts by unique slug.
 *
 * Run:  npx ts-node prisma/seeds/bc-neighbourhoods.ts
 */
import 'dotenv/config'
import { readFileSync } from 'fs'
import { join } from 'path'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const CSV_PATH = join(__dirname, 'data', 'bc_municipalities_neighbourhoods.csv')
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? process.env.MAPBOX_TOKEN ?? ''

// Cities already seeded elsewhere with bare-name slugs. Their sub-area rows are
// skipped here so we don't create `${name}-${city}` duplicates of them.
const PRESEEDED_CITIES = new Set(['Vancouver'])

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) })

// Collapse "(City)"/"(District)" municipal variants to the base city name so
// e.g. Langley (City) + Langley (District) browse as one "Langley".
function normaliseCity(municipality: string): string {
  return municipality.replace(/\s*\((city|district)\)\s*$/i, '').trim()
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[.']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

interface CsvRow {
  neighbourhood: string
  municipality: string
}

function parseCsv(text: string): CsvRow[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0)
  lines.shift() // header: neighbourhood,municipality,type,regional_district
  return lines.map((line) => {
    const cols = line.split(',')
    return { neighbourhood: cols[0].trim(), municipality: cols[1].trim() }
  })
}

async function geocode(query: string, types: string): Promise<{ lat: number; lng: number } | null> {
  if (!MAPBOX_TOKEN) return null
  const q = encodeURIComponent(query)
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${q}.json?country=CA&types=${types}&limit=1&access_token=${MAPBOX_TOKEN}`
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    const data = (await res.json()) as { features?: Array<{ geometry?: { coordinates?: [number, number] } }> }
    const coords = data.features?.[0]?.geometry?.coordinates
    if (!coords) return null
    const [lng, lat] = coords
    return { lat, lng }
  } catch {
    return null
  }
}

async function upsert(
  name: string,
  city: string,
  slug: string,
  geo: { query: string; types: string },
): Promise<'created' | 'updated'> {
  const existing = await prisma.neighbourhood.findUnique({ where: { slug } })
  const coords = existing?.lat == null ? await geocode(geo.query, geo.types) : null
  await prisma.neighbourhood.upsert({
    where: { slug },
    create: { name, slug, city, province: 'BC', lat: coords?.lat, lng: coords?.lng },
    update: { name, city, province: 'BC', ...(coords ? { lat: coords.lat, lng: coords.lng } : {}) },
  })
  if (coords) await new Promise((res) => setTimeout(res, 110)) // Mapbox rate limit
  return existing ? 'updated' : 'created'
}

async function main() {
  const rows = parseCsv(readFileSync(CSV_PATH, 'utf8'))

  const municipalities = new Set<string>()
  const neighbourhoods: Array<{ name: string; city: string }> = []
  for (const { neighbourhood, municipality } of rows) {
    const city = normaliseCity(municipality)
    municipalities.add(city)
    if (neighbourhood !== municipality) neighbourhoods.push({ name: neighbourhood, city })
  }

  if (!MAPBOX_TOKEN) {
    console.log('No Mapbox token — coordinates will be null (cards fall back to a placeholder image).')
  }

  let cityCreated = 0
  let cityUpdated = 0
  for (const city of [...municipalities].sort()) {
    const r = await upsert(city, city, slugify(city), { query: `${city} BC Canada`, types: 'place,locality' })
    r === 'created' ? cityCreated++ : cityUpdated++
  }

  let nbrCreated = 0
  let nbrUpdated = 0
  let nbrSkipped = 0
  for (const { name, city } of neighbourhoods) {
    if (PRESEEDED_CITIES.has(city)) {
      nbrSkipped++
      continue
    }
    const r = await upsert(name, city, slugify(`${name} ${city}`), {
      query: `${name}, ${city}, BC, Canada`,
      types: 'neighborhood,locality,place',
    })
    r === 'created' ? nbrCreated++ : nbrUpdated++
  }

  // Remove the legacy duplicate: Vancouver keeps bare-name slugs, so drop any
  // `${name}-vancouver` rows that shadow them (e.g. the stray kitsilano-vancouver).
  // Non-fatal: rows with related Property/LocalEssential records can't be
  // deleted here — they're reported so they can be reconciled manually.
  let dupRemoved = 0
  const dups = await prisma.neighbourhood.findMany({
    where: { city: 'Vancouver', slug: { endsWith: '-vancouver' } },
    select: { slug: true },
  })
  for (const { slug } of dups) {
    try {
      await prisma.neighbourhood.delete({ where: { slug } })
      dupRemoved++
    } catch {
      console.warn(`  ! could not remove duplicate "${slug}" (has related records) — reconcile manually`)
    }
  }

  console.log(
    `\nBC seed complete.\n` +
      `  Cities:        ${cityCreated} created, ${cityUpdated} updated (${municipalities.size} total)\n` +
      `  Neighbourhoods: ${nbrCreated} created, ${nbrUpdated} updated, ${nbrSkipped} skipped (pre-seeded)\n` +
      `  Duplicates removed: ${dupRemoved}`,
  )
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
