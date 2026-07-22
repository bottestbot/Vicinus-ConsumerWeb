import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env' })

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

// NBHD-18 — municipal open-data boundaries as the source of truth for
// neighbourhood geography.
//
// Point geocoding cannot be made reliable: it collapsed every West Vancouver
// neighbourhood onto one coordinate, put "Delta" in Nova Scotia, and matched
// Richmond's Granville to Vancouver's. A polygon published by the city itself
// has none of those failure modes — it cannot land in the wrong municipality
// and it cannot collapse onto a city centre.
//
// Stores the polygon in Neighbourhood.boundary (GeoJSON) and derives
// centroidLat/centroidLng from its geometry. The legacy lat/lng are untouched.
//
//   npx ts-node --transpile-only src/scripts/ingest-boundaries.ts
//   ... --dry-run     report without writing
//   ... --city=Vancouver
//
// Adding a city is one entry in SOURCES below.

interface Ring {
  0: number
  1: number
}
type Position = [number, number]
type Geometry =
  | { type: 'Polygon'; coordinates: Position[][] }
  | { type: 'MultiPolygon'; coordinates: Position[][][] }

interface SourceArea {
  name: string
  geometry: Geometry
}

interface Source {
  city: string
  label: string
  fetchAreas: () => Promise<SourceArea[]>
}

// ── sources ─────────────────────────────────────────────────────────────────

/** City of Vancouver — 22 official local areas (Opendatasoft). Verified. */
async function vancouverAreas(): Promise<SourceArea[]> {
  const url =
    'https://opendata.vancouver.ca/api/records/1.0/search/?dataset=local-area-boundary&rows=100'
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Vancouver open data returned ${res.status}`)
  const data = (await res.json()) as {
    records?: { fields?: { name?: string; geom?: Geometry } }[]
  }
  const areas: SourceArea[] = []
  for (const r of data.records ?? []) {
    const name = r.fields?.name
    const geometry = r.fields?.geom
    if (name && geometry) areas.push({ name, geometry })
  }
  return areas
}

const SOURCES: Source[] = [
  { city: 'Vancouver', label: 'City of Vancouver — local area boundaries', fetchAreas: vancouverAreas },
  // TODO NBHD-18: add Burnaby, Surrey, Richmond, New Westminster, North/West
  // Vancouver, Coquitlam, Port Moody and Port Coquitlam once their portal
  // endpoints are confirmed. Port Moody and Port Coquitlam matter most — their
  // neighbourhoods still share fallback centroids and so share a score.
]

// ── geometry ────────────────────────────────────────────────────────────────

/** Every ring of a Polygon/MultiPolygon, outer rings only. */
function outerRings(g: Geometry): Position[][] {
  return g.type === 'Polygon' ? [g.coordinates[0]] : g.coordinates.map((poly) => poly[0])
}

/** Shoelace area (signed, in squared degrees — only used to compare rings). */
function ringArea(ring: Position[]): number {
  let a = 0
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    a += ring[j][0] * ring[i][1] - ring[i][0] * ring[j][1]
  }
  return a / 2
}

/**
 * Area-weighted centroid of a ring. A vertex mean is NOT equivalent — it biases
 * toward whichever edge happens to be most finely digitised, which for a
 * coastline (most of West Vancouver) can pull the point into the water.
 */
function ringCentroid(ring: Position[]): Position {
  let x = 0
  let y = 0
  let a = 0
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const cross = ring[j][0] * ring[i][1] - ring[i][0] * ring[j][1]
    a += cross
    x += (ring[j][0] + ring[i][0]) * cross
    y += (ring[j][1] + ring[i][1]) * cross
  }
  a = a / 2
  if (a === 0) return ring[0]
  return [x / (6 * a), y / (6 * a)]
}

function pointInRing(p: Position, ring: Position[]): boolean {
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i]
    const [xj, yj] = ring[j]
    if (yi > p[1] !== yj > p[1] && p[0] < ((xj - xi) * (p[1] - yi)) / (yj - yi) + xi) {
      inside = !inside
    }
  }
  return inside
}

/**
 * Representative interior point: the area centroid of the largest ring, falling
 * back to a vertex if the shape is concave enough that the centroid lands
 * outside it (a U-shaped neighbourhood would otherwise get a centroid in the
 * gap, and its POI query would describe the wrong place).
 */
function representativePoint(g: Geometry): { lat: number; lng: number; insidePolygon: boolean } {
  const rings = outerRings(g)
  const largest = rings.reduce((best, r) =>
    Math.abs(ringArea(r)) > Math.abs(ringArea(best)) ? r : best,
  )
  const c = ringCentroid(largest)
  if (pointInRing(c, largest)) return { lng: c[0], lat: c[1], insidePolygon: true }

  // Concave: take the vertex nearest the centroid, nudged toward it.
  let nearest = largest[0]
  let bestD = Infinity
  for (const v of largest) {
    const d = (v[0] - c[0]) ** 2 + (v[1] - c[1]) ** 2
    if (d < bestD) {
      bestD = d
      nearest = v
    }
  }
  return { lng: (nearest[0] + c[0]) / 2, lat: (nearest[1] + c[1]) / 2, insidePolygon: false }
}

// ── matching ────────────────────────────────────────────────────────────────

const normalise = (s: string) =>
  s
    .toLowerCase()
    .replace(/[’']/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()

async function main() {
  const dryRun = process.argv.includes('--dry-run')
  const cityArg = process.argv.find((a) => a.startsWith('--city='))?.split('=')[1]

  let matched = 0
  let unmatchedRows = 0
  let unusedAreas = 0
  let outside = 0

  for (const source of SOURCES) {
    if (cityArg && source.city.toLowerCase() !== cityArg.toLowerCase()) continue

    console.log(`\n=== ${source.label} ===`)
    let areas: SourceArea[]
    try {
      areas = await source.fetchAreas()
    } catch (err) {
      console.warn(`  ! fetch failed: ${(err as Error).message}`)
      continue
    }
    console.log(`  fetched ${areas.length} boundaries`)

    const rows = await prisma.neighbourhood.findMany({
      where: { city: source.city },
      select: { id: true, name: true, slug: true, centroidLat: true, centroidLng: true },
    })

    const byName = new Map(areas.map((a) => [normalise(a.name), a]))
    const usedAreas = new Set<string>()

    for (const row of rows) {
      const key = normalise(row.name)
      // Exact normalised match only. A fuzzy match here is what put Richmond's
      // Granville in Vancouver; an unmatched row keeps its existing centroid
      // rather than adopting a neighbouring area's polygon.
      const area = byName.get(key)
      if (!area) {
        unmatchedRows++
        console.log(`  --      ${row.name} — no matching boundary`)
        continue
      }
      usedAreas.add(key)

      const point = representativePoint(area.geometry)
      if (!point.insidePolygon) outside++
      const moved =
        row.centroidLat != null && row.centroidLng != null
          ? haversineKm(
              { lat: row.centroidLat, lng: row.centroidLng },
              { lat: point.lat, lng: point.lng },
            )
          : null

      if (!dryRun) {
        await prisma.neighbourhood.update({
          where: { id: row.id },
          data: {
            boundary: area.geometry as unknown as object,
            centroidLat: point.lat,
            centroidLng: point.lng,
          },
        })
      }
      matched++
      console.log(
        `  OK      ${row.name} → ${point.lat.toFixed(4)},${point.lng.toFixed(4)}` +
          `${moved != null ? `  [moved ${moved.toFixed(2)} km]` : ''}` +
          `${point.insidePolygon ? '' : '  (concave — interior point)'}`,
      )
    }

    for (const [key, area] of byName) {
      if (!usedAreas.has(key)) {
        unusedAreas++
        console.log(`  ??      boundary "${area.name}" has no neighbourhood row`)
      }
    }
  }

  console.log(
    `\nmatched ${matched} · rows without a boundary ${unmatchedRows} · ` +
      `boundaries without a row ${unusedAreas} · concave ${outside}`,
  )
  if (dryRun) console.log('(dry run — nothing written)')
  else if (matched > 0) {
    console.log('\nCentroids changed. POIs for moved rows are now stale — re-ingest and rescore:')
    console.log('  npm run scores:neighbourhoods -- --only-missing')
  }

  await prisma.$disconnect()
}

function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * 6371 * Math.asin(Math.min(1, Math.sqrt(h)))
}

main().catch((err) => {
  console.error('Boundary ingest failed:', err)
  process.exit(1)
})
