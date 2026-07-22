import { Injectable, Logger } from '@nestjs/common'
import { HttpService } from '@nestjs/axios'
import { ConfigService } from '@nestjs/config'
import { firstValueFrom } from 'rxjs'
import { PrismaService } from '../../prisma/prisma.service'
import { PoiCategory } from './scoring/geo'

// NBHD-02 — OSM/Overpass POI ingestion. Raw POIs are snapshotted per run so a
// quarterly refresh replaces a neighbourhood's set atomically. ODbL attribution
// is required anywhere these are surfaced to users.
export const ODBL_ATTRIBUTION = '© OpenStreetMap contributors (ODbL)'

// Overpass mirrors, tried in order. The main instance is frequently saturated
// (504 "server too busy"), so a run of any size needs somewhere else to go.
const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.osm.ch/api/interpreter',
]

// Overpass rejects requests carrying a generic library User-Agent with
// 406 Not Acceptable (axios sends "axios/<version>" by default). Their usage
// policy asks callers to identify themselves, so send something descriptive.
const USER_AGENT = 'Vicinus/1.0 (+https://vicinus.ca; neighbourhood livability scoring)'

const DEFAULT_RADIUS_M = 1500
const OVERPASS_TIMEOUT_S = 25
// Politeness delay between neighbourhoods in the batch — Overpass is a shared
// free endpoint and rate-limits aggressive callers.
const BATCH_DELAY_MS = 1500
// Transient server-side conditions worth retrying rather than dropping the
// neighbourhood to zero POIs.
const RETRYABLE_STATUS = new Set([429, 502, 503, 504])
const MAX_ATTEMPTS_PER_ENDPOINT = 2

const AMENITY_FILTER = 'restaurant|cafe|bar|supermarket|school|hospital|pharmacy|bank|park'
const LEISURE_FILTER = 'park|playground'

interface OverpassElement {
  type: 'node' | 'way' | 'relation'
  id: number
  lat?: number
  lon?: number
  center?: { lat: number; lon: number }
  tags?: Record<string, string>
}

@Injectable()
export class PoiIngestionService {
  private readonly logger = new Logger(PoiIngestionService.name)

  constructor(
    private readonly http: HttpService,
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  /** Ingest POIs for one neighbourhood; fail-soft (logs + returns 0 on error). */
  async ingestPoisForNeighbourhood(
    neighbourhoodId: string,
    radius: number = DEFAULT_RADIUS_M,
  ): Promise<number> {
    const neighbourhood = await this.prisma.neighbourhood.findUnique({
      where: { id: neighbourhoodId },
      select: { id: true, lat: true, lng: true, centroidLat: true, centroidLng: true },
    })
    if (!neighbourhood) {
      this.logger.warn(`Neighbourhood ${neighbourhoodId} not found — skipping POI ingest`)
      return 0
    }
    const lat = neighbourhood.centroidLat ?? neighbourhood.lat
    const lng = neighbourhood.centroidLng ?? neighbourhood.lng
    if (lat == null || lng == null) {
      this.logger.warn(`Neighbourhood ${neighbourhoodId} has no centroid — skipping POI ingest`)
      return 0
    }

    // Deliberately NOT caught here: a failed fetch must not be recorded as
    // "this area has no amenities". The batch loop below catches and counts it,
    // and scoring skips neighbourhoods with no POI snapshot, so a transient
    // Overpass outage leaves scores null instead of writing a bogus 0.
    const elements = await this.queryOverpass(lat, lng, radius)

    const snapshotVersion = currentSnapshotVersion()
    const rows = elements
      .map((el) => this.toPoiRow(el, neighbourhoodId, snapshotVersion))
      .filter((r): r is PoiRow => r !== null)

    // Replace this neighbourhood's rows for the current snapshot atomically.
    await this.prisma.$transaction([
      this.prisma.neighbourhoodPoi.deleteMany({ where: { neighbourhoodId, snapshotVersion } }),
      this.prisma.neighbourhoodPoi.createMany({ data: rows }),
    ])

    this.logger.log(`Ingested ${rows.length} POIs for ${neighbourhoodId} (${snapshotVersion})`)
    return rows.length
  }

  /**
   * Batch: ingest every neighbourhood sequentially with a politeness delay.
   * Failures are counted and reported rather than silently yielding 0 POIs —
   * Overpass returns 504 often enough that a quiet failure would otherwise
   * score a real neighbourhood as having no amenities.
   */
  async ingestAllNeighbourhoods(
    radius: number = DEFAULT_RADIUS_M,
    options: { onlyMissing?: boolean } = {},
  ): Promise<{ total: number; failed: string[] }> {
    const neighbourhoods = await this.prisma.neighbourhood.findMany({
      // Overpass fails often enough that a full run leaves a tail of
      // neighbourhoods with no POIs. `onlyMissing` retries just those instead
      // of re-fetching hundreds that already succeeded.
      where: options.onlyMissing ? { pois: { none: {} } } : {},
      select: { id: true, name: true },
    })
    let total = 0
    const failed: string[] = []
    for (const { id, name } of neighbourhoods) {
      try {
        total += await this.ingestPoisForNeighbourhood(id, radius)
      } catch (err) {
        this.logger.warn(`POI ingest failed for ${name}: ${(err as Error).message}`)
        failed.push(name)
      }
      await delay(BATCH_DELAY_MS)
    }
    if (failed.length > 0) {
      this.logger.warn(`${failed.length}/${neighbourhoods.length} neighbourhoods failed to ingest`)
    }
    return { total, failed }
  }

  private async queryOverpass(
    lat: number,
    lng: number,
    radius: number,
  ): Promise<OverpassElement[]> {
    const around = `around:${radius},${lat},${lng}`
    const query = `[out:json][timeout:${OVERPASS_TIMEOUT_S}];
(
  node["amenity"~"${AMENITY_FILTER}"](${around});
  way["amenity"~"${AMENITY_FILTER}"](${around});
  node["shop"](${around});
  way["shop"](${around});
  node["leisure"~"${LEISURE_FILTER}"](${around});
  way["leisure"~"${LEISURE_FILTER}"](${around});
);
out center tags;`

    // A self-hosted OVERPASS_URL, when configured, takes priority over the mirrors.
    const configured = this.config.get<string>('OVERPASS_URL')
    const endpoints = configured ? [configured, ...OVERPASS_ENDPOINTS] : OVERPASS_ENDPOINTS

    let lastError: Error = new Error('No Overpass endpoint attempted')
    for (const url of endpoints) {
      for (let attempt = 1; attempt <= MAX_ATTEMPTS_PER_ENDPOINT; attempt++) {
        try {
          const response = await firstValueFrom(
            this.http.post<{ elements: OverpassElement[] }>(
              url,
              `data=${encodeURIComponent(query)}`,
              {
                headers: {
                  'Content-Type': 'application/x-www-form-urlencoded',
                  'User-Agent': USER_AGENT,
                },
                // Overpass can be slow; cap total wait a little above its internal timeout.
                timeout: (OVERPASS_TIMEOUT_S + 10) * 1000,
              },
            ),
          )
          return response.data?.elements ?? []
        } catch (err) {
          lastError = err as Error
          const status = (err as { response?: { status?: number } }).response?.status
          // A non-retryable status (e.g. 400 bad query) won't improve on retry
          // or on another mirror — surface it immediately.
          if (status !== undefined && !RETRYABLE_STATUS.has(status)) throw err
          if (attempt < MAX_ATTEMPTS_PER_ENDPOINT) await delay(attempt * 2000)
        }
      }
      this.logger.debug(`Overpass endpoint ${url} exhausted, trying next mirror`)
    }
    throw lastError
  }

  private toPoiRow(
    el: OverpassElement,
    neighbourhoodId: string,
    snapshotVersion: string,
  ): PoiRow | null {
    const lat = el.lat ?? el.center?.lat
    const lng = el.lon ?? el.center?.lon
    if (lat == null || lng == null) return null
    const category = mapTagsToCategory(el.tags ?? {})
    if (!category) return null
    return {
      neighbourhoodId,
      osmId: `${el.type}/${el.id}`,
      category,
      name: el.tags?.name ?? null,
      lat,
      lng,
      snapshotVersion,
    }
  }
}

interface PoiRow {
  neighbourhoodId: string
  osmId: string
  category: PoiCategory
  name: string | null
  lat: number
  lng: number
  snapshotVersion: string
}

// Map raw OSM tags into a single livability category. Amenity tags take
// precedence over the generic `shop=*` (which falls through to errands).
function mapTagsToCategory(tags: Record<string, string>): PoiCategory | null {
  const amenity = tags['amenity']
  switch (amenity) {
    case 'supermarket':
      return 'grocery'
    case 'restaurant':
      return 'restaurants'
    case 'cafe':
      return 'coffee'
    case 'bar':
      return 'entertainment'
    case 'school':
      return 'schools'
    case 'hospital':
    case 'pharmacy':
      return 'healthcare'
    case 'bank':
      return 'banks'
    case 'park':
      return 'parks'
  }
  const leisure = tags['leisure']
  if (leisure === 'park' || leisure === 'playground') return 'parks'
  // A grocery-ish shop is still grocery; everything else is a daily errand.
  if (tags['shop']) {
    return tags['shop'] === 'supermarket' || tags['shop'] === 'convenience' ? 'grocery' : 'errands'
  }
  return null
}

/** OSM snapshot tag `YYYY-Qn` for the current quarter (app runtime, not a workflow). */
function currentSnapshotVersion(): string {
  const now = new Date()
  const quarter = Math.floor(now.getUTCMonth() / 3) + 1
  return `${now.getUTCFullYear()}-Q${quarter}`
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
