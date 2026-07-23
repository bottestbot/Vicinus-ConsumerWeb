import { Injectable, Logger } from '@nestjs/common'
import { HttpService } from '@nestjs/axios'
import { ConfigService } from '@nestjs/config'
import { PrismaService } from '../../prisma/prisma.service'
import { fetchOverpass, OverpassElement } from './overpass'
import {
  LatLng,
  nearestVertexMeters,
  polygonAreaSqMeters,
  polylineMeters,
} from './scoring/geo'

// VIBE-01 — Neighbourhood "vibe" input acquisition from OSM.
//
// Unlike NBHD-02 POIs (points → NeighbourhoodPoi rows), the vibe inputs are OSM
// *ways*: bike lanes are lines (measured by length), green cover is polygons
// (measured by area), and major roads / rail / airports are lines whose nearest
// approach we want. None of these fit the point-shaped NeighbourhoodPoi/POI
// category model, so each neighbourhood is reduced to a handful of summary
// metrics persisted directly onto the Neighbourhood row (see VibeMetrics).
//
// The query uses `out geom` (not `out center`) so ways carry their full node
// list, which the length/area maths needs. Snapshotted per quarter like POIs.

const DEFAULT_RADIUS_M = 1500
const OVERPASS_TIMEOUT_S = 60 // geometry payloads are heavier than the POI query
// Politeness delay between neighbourhoods — Overpass is a shared free endpoint.
const BATCH_DELAY_MS = 1500

export interface VibeMetrics {
  // Total length of cycling infrastructure within the radius, in kilometres.
  bikeLaneKm: number
  // Share of the search disc covered by green land use / natural areas, 0–100.
  greenCoverPct: number
  // Metres to the nearest major road / railway / airport, or null when none is
  // within the radius (i.e. no nearby noise source of that kind — a good sign).
  nearestMajorRoadM: number | null
  nearestRailM: number | null
  nearestAirportM: number | null
}

@Injectable()
export class VibeMetricsService {
  private readonly logger = new Logger(VibeMetricsService.name)

  constructor(
    private readonly http: HttpService,
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  /** Ingest + persist vibe metrics for one neighbourhood. Never swallows a
   *  failed fetch — the batch loop counts it, so a transient Overpass outage
   *  leaves the columns null rather than writing a bogus "no bike lanes here". */
  async ingestForNeighbourhood(
    neighbourhoodId: string,
    radius: number = DEFAULT_RADIUS_M,
  ): Promise<VibeMetrics | null> {
    const neighbourhood = await this.prisma.neighbourhood.findUnique({
      where: { id: neighbourhoodId },
      select: { id: true, lat: true, lng: true, centroidLat: true, centroidLng: true },
    })
    if (!neighbourhood) {
      this.logger.warn(`Neighbourhood ${neighbourhoodId} not found — skipping vibe ingest`)
      return null
    }
    const lat = neighbourhood.centroidLat ?? neighbourhood.lat
    const lng = neighbourhood.centroidLng ?? neighbourhood.lng
    if (lat == null || lng == null) {
      this.logger.warn(`Neighbourhood ${neighbourhoodId} has no centroid — skipping vibe ingest`)
      return null
    }

    const elements = await this.queryOverpass(lat, lng, radius)
    const metrics = computeMetrics(elements, { lat, lng }, radius)

    await this.prisma.neighbourhood.update({
      where: { id: neighbourhoodId },
      data: {
        bikeLaneKm: metrics.bikeLaneKm,
        greenCoverPct: metrics.greenCoverPct,
        nearestMajorRoadM: metrics.nearestMajorRoadM,
        nearestRailM: metrics.nearestRailM,
        nearestAirportM: metrics.nearestAirportM,
        vibeMetricsVersion: currentSnapshotVersion(),
        vibeMetricsComputedAt: new Date(),
      },
    })

    this.logger.log(
      `Vibe metrics for ${neighbourhoodId}: ${metrics.bikeLaneKm}km bike, ` +
        `${metrics.greenCoverPct}% green, road ${fmtM(metrics.nearestMajorRoadM)}`,
    )
    return metrics
  }

  /** Batch: every neighbourhood sequentially with a politeness delay. Failures
   *  are counted and reported rather than silently leaving stale/zero data. */
  async ingestAllNeighbourhoods(
    radius: number = DEFAULT_RADIUS_M,
    options: { onlyMissing?: boolean } = {},
  ): Promise<{ total: number; failed: string[] }> {
    const neighbourhoods = await this.prisma.neighbourhood.findMany({
      where: options.onlyMissing ? { vibeMetricsComputedAt: null } : {},
      select: { id: true, name: true },
    })
    let total = 0
    const failed: string[] = []
    for (const { id, name } of neighbourhoods) {
      try {
        const metrics = await this.ingestForNeighbourhood(id, radius)
        if (metrics) total++
      } catch (err) {
        this.logger.warn(`Vibe ingest failed for ${name}: ${(err as Error).message}`)
        failed.push(name)
      }
      await delay(BATCH_DELAY_MS)
    }
    if (failed.length > 0) {
      this.logger.warn(
        `${failed.length}/${neighbourhoods.length} neighbourhoods failed vibe ingest`,
      )
    }
    return { total, failed }
  }

  private async queryOverpass(
    lat: number,
    lng: number,
    radius: number,
  ): Promise<OverpassElement[]> {
    const around = `around:${radius},${lat},${lng}`
    // Bike infra, green cover, and the three noise sources in one pass. `out
    // geom` returns each way's node list, which length/area/nearest all need.
    const query = `[out:json][timeout:${OVERPASS_TIMEOUT_S}];
(
  way["highway"="cycleway"](${around});
  way["cycleway"~"lane|track|opposite_lane|opposite_track"](${around});
  way["bicycle"="designated"](${around});
  way["landuse"~"grass|forest|meadow|recreation_ground|village_green|greenfield|allotments"](${around});
  way["leisure"~"park|garden|nature_reserve|pitch|playground|golf_course"](${around});
  way["natural"~"wood|scrub|grassland|heath"](${around});
  way["highway"~"^(motorway|trunk|primary)$"](${around});
  way["railway"="rail"](${around});
  way["aeroway"~"aerodrome|runway"](${around});
);
out geom;`
    return fetchOverpass(this.http, this.config, query, OVERPASS_TIMEOUT_S)
  }
}

// ── Pure metric computation (exported for unit testing) ─────────────────────

const GREEN_LANDUSE = new Set([
  'grass',
  'forest',
  'meadow',
  'recreation_ground',
  'village_green',
  'greenfield',
  'allotments',
])
const GREEN_LEISURE = new Set([
  'park',
  'garden',
  'nature_reserve',
  'pitch',
  'playground',
  'golf_course',
])
const GREEN_NATURAL = new Set(['wood', 'scrub', 'grassland', 'heath'])
const MAJOR_ROADS = new Set(['motorway', 'trunk', 'primary'])

export function computeMetrics(
  elements: OverpassElement[],
  centroid: LatLng,
  radius: number,
): VibeMetrics {
  let bikeMeters = 0
  let greenAreaSqM = 0
  let nearestRoad = Infinity
  let nearestRail = Infinity
  let nearestAirport = Infinity

  for (const el of elements) {
    const geometry = el.geometry
    if (!geometry || geometry.length === 0) continue
    const points: LatLng[] = geometry.map((g) => ({ lat: g.lat, lng: g.lon }))
    const tags = el.tags ?? {}

    if (isBike(tags)) bikeMeters += polylineMeters(points)
    if (isGreen(tags)) greenAreaSqM += polygonAreaSqMeters(points, centroid)

    if (tags['highway'] && MAJOR_ROADS.has(tags['highway'])) {
      nearestRoad = Math.min(nearestRoad, nearestVertexMeters(centroid, points))
    }
    if (tags['railway'] === 'rail') {
      nearestRail = Math.min(nearestRail, nearestVertexMeters(centroid, points))
    }
    if (tags['aeroway']) {
      nearestAirport = Math.min(nearestAirport, nearestVertexMeters(centroid, points))
    }
  }

  // Green cover as a share of the search disc. Polygons can overlap or spill
  // past the radius, so the sum can exceed the disc — clamp to 100%.
  const discAreaSqM = Math.PI * radius * radius
  const greenCoverPct = clamp0to100((greenAreaSqM / discAreaSqM) * 100)

  return {
    bikeLaneKm: round(bikeMeters / 1000, 2),
    greenCoverPct: round(greenCoverPct, 1),
    nearestMajorRoadM: finiteOrNull(nearestRoad),
    nearestRailM: finiteOrNull(nearestRail),
    nearestAirportM: finiteOrNull(nearestAirport),
  }
}

function isBike(tags: Record<string, string>): boolean {
  if (tags['highway'] === 'cycleway') return true
  if (tags['bicycle'] === 'designated') return true
  const cw = tags['cycleway']
  return cw === 'lane' || cw === 'track' || cw === 'opposite_lane' || cw === 'opposite_track'
}

function isGreen(tags: Record<string, string>): boolean {
  return (
    (tags['landuse'] !== undefined && GREEN_LANDUSE.has(tags['landuse'])) ||
    (tags['leisure'] !== undefined && GREEN_LEISURE.has(tags['leisure'])) ||
    (tags['natural'] !== undefined && GREEN_NATURAL.has(tags['natural']))
  )
}

/** OSM snapshot tag `YYYY-Qn` for the current quarter (mirrors PoiIngestion). */
function currentSnapshotVersion(): string {
  const now = new Date()
  const quarter = Math.floor(now.getUTCMonth() / 3) + 1
  return `${now.getUTCFullYear()}-Q${quarter}`
}

function finiteOrNull(n: number): number | null {
  return Number.isFinite(n) ? Math.round(n) : null
}

function clamp0to100(n: number): number {
  return Math.max(0, Math.min(100, n))
}

function round(n: number, dp: number): number {
  const f = 10 ** dp
  return Math.round(n * f) / f
}

function fmtM(n: number | null): string {
  return n == null ? '—' : `${n}m`
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
