import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env' })
dotenv.config({ path: '../.env.local', override: false })

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? process.env.MAPBOX_TOKEN ?? ''

// Re-geocode neighbourhood centroids with validation.
//
// The original backfill (backfill-neighbourhood-coords.ts) requested
// `types=neighborhood,place`. `place` is Mapbox's city type, so whenever it
// couldn't resolve a neighbourhood it silently returned the CITY centre and the
// script stored it — collapsing every neighbourhood in a city onto one point
// (all 9 West Vancouver entries scored identically) — and because the query
// carried no province, names like "Delta" and "Quadra" matched Nova Scotia.
//
// This version drops the `place` fallback, constrains to BC, biases toward the
// right city, and REJECTS anything that fails validation rather than storing a
// plausible-looking wrong answer. A rejected neighbourhood keeps a null centroid
// and stays unrated, which is the honest outcome.
//
//   npx ts-node --transpile-only src/scripts/fix-neighbourhood-centroids.ts
//   ... --all              every neighbourhood, not just the priority cities
//   ... --dry-run          report without writing
//
// Writes centroidLat/centroidLng (NBHD-01), leaving the legacy lat/lng intact.

const PRIORITY_CITIES = [
  'Vancouver',
  'Burnaby',
  'Richmond',
  'Surrey',
  'Coquitlam',
  'Port Moody',
  'Port Coquitlam',
  'North Vancouver',
  'West Vancouver',
  'New Westminster',
]

// British Columbia bounding box [minLng, minLat, maxLng, maxLat].
const BC_BBOX: [number, number, number, number] = [-139.06, 48.2, -114.03, 60.0]
// A neighbourhood should sit within this far of its city centre. Surrey is by
// far the largest priority city — Ocean Park is a legitimate 17.8km from its
// centre — so this can't be tight. Correctness comes from the place_type and
// name checks below, not from the radius.
const MAX_KM_FROM_CITY = 20

interface LatLng {
  lat: number
  lng: number
}

function haversineKm(a: LatLng, b: LatLng): number {
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * 6371 * Math.asin(Math.min(1, Math.sqrt(h)))
}

const inBc = (p: LatLng) =>
  p.lng >= BC_BBOX[0] && p.lng <= BC_BBOX[2] && p.lat >= BC_BBOX[1] && p.lat <= BC_BBOX[3]

interface Feature {
  place_type?: string[]
  text?: string
  geometry?: { coordinates?: [number, number] }
}

async function mapbox(query: string, params: Record<string, string>): Promise<Feature[]> {
  const qs = new URLSearchParams({
    country: 'CA',
    limit: '3',
    access_token: MAPBOX_TOKEN,
    ...params,
  })
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?${qs}`
  const res = await fetch(url)
  if (!res.ok) return []
  const data = (await res.json()) as { features?: Feature[] }
  return data.features ?? []
}

const toLatLng = (f: Feature): LatLng | null => {
  const c = f.geometry?.coordinates
  return c ? { lat: c[1], lng: c[0] } : null
}

/** Resolve a city centre once, used for proximity biasing and distance checks. */
async function geocodeCity(city: string): Promise<LatLng | null> {
  const feats = await mapbox(`${city}, British Columbia, Canada`, {
    types: 'place',
    bbox: BC_BBOX.join(','),
  })
  for (const f of feats) {
    const p = toLatLng(f)
    if (p && inBc(p)) return p
  }
  return null
}

type Outcome =
  | { ok: true; point: LatLng; source: string }
  | { ok: false; reason: string }

// Mapbox has no entry at all for a number of real BC neighbourhoods — Ambleside,
// Upper Lonsdale and Terra Nova return only their city as a fallback. OSM tags
// all three as place=suburb/neighbourhood with good coordinates, and we already
// depend on Overpass for POIs, so it makes a solid second source.
const OVERPASS_UA = 'Vicinus/1.0 (+https://vicinus.ca; neighbourhood centroids)'
const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
]

async function overpassLookup(name: string, centre: LatLng): Promise<LatLng | null> {
  const radius = Math.round(MAX_KM_FROM_CITY * 1000)
  const escaped = name.replace(/"/g, '\\"')
  const filter = `["place"~"suburb|neighbourhood|quarter|locality"]["name"="${escaped}"]`
  const query = `[out:json][timeout:25];
(
  node${filter}(around:${radius},${centre.lat},${centre.lng});
  way${filter}(around:${radius},${centre.lat},${centre.lng});
  relation${filter}(around:${radius},${centre.lat},${centre.lng});
);
out center tags;`

  for (const url of OVERPASS_ENDPOINTS) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': OVERPASS_UA,
        },
        body: `data=${encodeURIComponent(query)}`,
      })
      if (!res.ok) continue
      const data = (await res.json()) as {
        elements?: { lat?: number; lon?: number; center?: { lat: number; lon: number } }[]
      }
      for (const el of data.elements ?? []) {
        const lat = el.lat ?? el.center?.lat
        const lng = el.lon ?? el.center?.lon
        if (lat == null || lng == null) continue
        const p = { lat, lng }
        if (inBc(p) && haversineKm(p, centre) <= MAX_KM_FROM_CITY) return p
      }
      return null
    } catch {
      // try the next mirror
    }
  }
  return null
}

async function geocodeNeighbourhood(
  name: string,
  city: string,
  cityCentre: LatLng,
): Promise<Outcome> {
  // Ask for addresses too: many real neighbourhoods (Edgemont, Deer Lake) have
  // no Mapbox `neighborhood` entry but do have an eponymous street, which is a
  // fair centroid approximation. `place` is requested only so it can be
  // explicitly rejected below rather than silently ranked in.
  const feats = await mapbox(`${name}, ${city}, British Columbia, Canada`, {
    types: 'neighborhood,locality,address,place',
    bbox: BC_BBOX.join(','),
    proximity: `${cityCentre.lng},${cityCentre.lat}`,
  })
  if (feats.length === 0) return { ok: false, reason: 'no geocode result' }

  const nameKey = name.toLowerCase()
  const candidates: { p: LatLng; tier: number }[] = []

  for (const f of feats) {
    const p = toLatLng(f)
    if (!p || !inBc(p)) continue
    const types = f.place_type ?? []

    // A city-level hit is exactly the fallback that collapsed every
    // neighbourhood in a city onto one point. Never accept it for a row whose
    // name differs from its city. Discriminating on place_type rather than on
    // distance-to-centre matters: Central Lonsdale legitimately sits 120m from
    // North Vancouver's centre and a distance rule wrongly threw it away.
    if (types.includes('place') && nameKey !== city.toLowerCase()) continue

    // Tightened from 25km: "Hamilton, North Vancouver" matched a Hamilton 17.8km
    // south in Richmond and passed the looser check.
    if (haversineKm(p, cityCentre) > MAX_KM_FROM_CITY) continue

    if (types.includes('neighborhood') || types.includes('locality')) {
      candidates.push({ p, tier: 0 })
    } else if (types.includes('address') && (f.text ?? '').toLowerCase().startsWith(nameKey)) {
      // Only an address actually named after the neighbourhood.
      candidates.push({ p, tier: 1 })
    }
  }

  // Prefer a real neighbourhood/locality hit; fall back to OSM before settling
  // for a street that merely shares the name.
  const best = candidates.sort((a, b) => a.tier - b.tier)[0]
  if (best && best.tier === 0) return { ok: true, point: best.p, source: 'mapbox' }

  const osm = await overpassLookup(name, cityCentre)
  if (osm) return { ok: true, point: osm, source: 'osm' }

  if (best) return { ok: true, point: best.p, source: 'mapbox-street' }
  return { ok: false, reason: 'no match in Mapbox or OSM' }
}

async function main() {
  if (!MAPBOX_TOKEN) {
    console.error('No Mapbox token. Set NEXT_PUBLIC_MAPBOX_TOKEN or MAPBOX_TOKEN.')
    process.exit(1)
  }
  const all = process.argv.includes('--all')
  const dryRun = process.argv.includes('--dry-run')

  const rows = await prisma.neighbourhood.findMany({
    where: all ? {} : { city: { in: PRIORITY_CITIES } },
    select: { id: true, name: true, city: true, lat: true, lng: true },
    orderBy: [{ city: 'asc' }, { name: 'asc' }],
  })
  console.log(`${rows.length} neighbourhoods${all ? '' : ' in priority cities'}${dryRun ? ' (dry run)' : ''}\n`)

  const cityCentres = new Map<string, LatLng | null>()
  let resolved = 0
  let rejected = 0
  let moved = 0

  for (const row of rows) {
    const city = row.city
    if (!city) {
      console.log(`  REJECT  ${row.name} — no city on record`)
      rejected++
      continue
    }
    if (!cityCentres.has(city)) {
      cityCentres.set(city, await geocodeCity(city))
      await new Promise((r) => setTimeout(r, 110))
    }
    const centre = cityCentres.get(city)
    if (!centre) {
      console.log(`  REJECT  ${row.name} (${city}) — could not resolve city centre`)
      rejected++
      continue
    }

    // A row named after its own city legitimately sits at the city centre.
    const outcome: Outcome =
      row.name.toLowerCase() === city.toLowerCase()
        ? { ok: true, point: centre, source: 'city' }
        : await geocodeNeighbourhood(row.name, city, centre)
    await new Promise((r) => setTimeout(r, 110))

    if (!outcome.ok) {
      console.log(`  REJECT  ${row.name} (${city}) — ${outcome.reason}`)
      rejected++
      if (!dryRun) {
        // Clear rather than keep a known-bad centroid.
        await prisma.neighbourhood.update({
          where: { id: row.id },
          data: { centroidLat: null, centroidLng: null },
        })
      }
      continue
    }

    const shiftKm =
      row.lat != null && row.lng != null
        ? haversineKm(outcome.point, { lat: row.lat, lng: row.lng })
        : null
    if (shiftKm != null && shiftKm > 0.2) moved++
    resolved++
    console.log(
      `  OK      ${row.name} (${city}) → ${outcome.point.lat.toFixed(4)},${outcome.point.lng.toFixed(4)}` +
        `  (${outcome.source})` + (shiftKm != null ? ` [moved ${shiftKm.toFixed(1)} km]` : ''),
    )
    if (!dryRun) {
      await prisma.neighbourhood.update({
        where: { id: row.id },
        data: { centroidLat: outcome.point.lat, centroidLng: outcome.point.lng },
      })
    }
  }

  console.log(
    `\nresolved ${resolved} · rejected ${rejected} · moved >200m ${moved}` +
      (dryRun ? '\n(dry run — nothing written)' : ''),
  )

  if (!dryRun && resolved > 0) {
    const distinct = await prisma.$queryRawUnsafe<{ city: string; n: bigint; coords: bigint }[]>(
      `SELECT city, count(*) AS n, count(DISTINCT round("centroidLat"::numeric,3)||','||round("centroidLng"::numeric,3)) AS coords
       FROM "Neighbourhood" WHERE "centroidLat" IS NOT NULL ${all ? '' : `AND city IN (${PRIORITY_CITIES.map((c) => `'${c.replace(/'/g, "''")}'`).join(',')})`}
       GROUP BY city ORDER BY city`,
    )
    console.log('\n=== distinct centroids per city (was 1 for West Van / Port Moody / PoCo) ===')
    for (const d of distinct) console.log(`  ${String(d.coords).padStart(3)} / ${String(d.n).padStart(3)}  ${d.city}`)
    console.log('\nNext: POIs for moved neighbourhoods are now stale. Re-ingest and rescore them.')
  }

  await prisma.$disconnect()
}

main().catch((err) => {
  console.error('Centroid fix failed:', err)
  process.exit(1)
})
