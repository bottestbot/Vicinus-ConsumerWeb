import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { distanceDecay, haversineMeters, LatLng } from './geo'
import { buildTransitIndex, TransitStopIndex } from './gtfs-transit-index'

export interface TransitResult {
  score: number | null
  source: 'gtfs' | 'unavailable'
}

// NBHD-05 / NBHD-19 — transit sub-score from agency GTFS.
// Decision (2026-07-20): build from agency GTFS, no paid Transit Score API.
//
// A stop contributes its peak-weighted weekday trip count, distance-decayed from
// the neighbourhood centroid: full credit within a 5-minute walk (≤400m),
// decaying to 0 at 1200m. The decayed sum is normalized to 0-100.
//
// Scope (NBHD-19): TransLink's feed covers Metro Vancouver only. A neighbourhood
// with NO stop within range is treated as outside the feed's coverage and
// returns `null` (not 0) — the rest of BC is served by BC Transit's separate
// feeds, which aren't wired up. This naturally limits scoring to the launch set
// without hardcoding a city list.
const FULL_CREDIT_M = 400
const ZERO_CREDIT_M = 1200
// Stops are only considered out to ZERO_CREDIT_M; beyond that they contribute 0.
const COVERAGE_RADIUS_M = ZERO_CREDIT_M
// Normalization anchor — the decayed weighted-trip sum that maps to 100.
// Calibrated to the launch-set (Metro Vancouver) distribution: raw sums are
// heavy-tailed (median ~3600, max ~32800), so the anchor sits near the 90th
// percentile (~7000). Frequent-service hubs (SkyTrain + bus) clip to 100, the
// median neighbourhood lands ~50, and low-service edges land near 0 — a real
// spread rather than everything pinned at the ceiling.
const NORMALIZATION_ANCHOR = 7000

@Injectable()
export class TransitService {
  private readonly logger = new Logger(TransitService.name)
  // Parsed once (stop_times.txt is ~94 MB) and reused for every neighbourhood in
  // a scoring run. Keyed by feed dir so a path change rebuilds it.
  private indexPromise: Promise<TransitStopIndex | null> | null = null
  private indexKey: string | null = null

  constructor(private readonly config: ConfigService) {}

  async score(centroid: LatLng): Promise<TransitResult> {
    const index = await this.getIndex()
    if (!index) return { score: null, source: 'unavailable' }

    let decayedSum = 0
    let stopsInRange = 0
    for (const stop of index.stops) {
      const meters = haversineMeters(centroid, stop)
      if (meters > COVERAGE_RADIUS_M) continue
      stopsInRange += 1
      decayedSum += stop.weight * distanceDecay(meters, FULL_CREDIT_M, ZERO_CREDIT_M)
    }

    // No stop in range → outside the feed's coverage area. Null, not 0.
    if (stopsInRange === 0) return { score: null, source: 'unavailable' }

    const score = Math.min(100, (decayedSum / NORMALIZATION_ANCHOR) * 100)
    return { score: Math.round(score * 10) / 10, source: 'gtfs' }
  }

  private getIndex(): Promise<TransitStopIndex | null> {
    const dir =
      this.config.get<string>('TRANSLINK_GTFS_PATH') ??
      this.config.get<string>('BC_TRANSIT_GTFS_PATH')

    // TODO: add TRANSLINK_GTFS_PATH to env (run `npm run gtfs:translink` first)
    if (!dir) {
      if (this.indexKey !== '') {
        this.logger.warn('No GTFS feed path configured — transit scores unavailable')
        this.indexKey = ''
        this.indexPromise = Promise.resolve(null)
      }
      return this.indexPromise!
    }

    if (this.indexKey === dir && this.indexPromise) return this.indexPromise

    this.indexKey = dir
    this.indexPromise = this.loadIndex(dir)
    return this.indexPromise
  }

  private async loadIndex(dir: string): Promise<TransitStopIndex | null> {
    if (!existsSync(join(dir, 'stop_times.txt')) || !existsSync(join(dir, 'stops.txt'))) {
      this.logger.warn(`GTFS feed not found at "${dir}" — transit scores unavailable`)
      return null
    }
    try {
      const index = await buildTransitIndex(dir)
      this.logger.log(
        `Loaded GTFS: ${index.stops.length} stops, ${index.totalTrips} weekday trips`,
      )
      return index
    } catch (err) {
      this.logger.warn(`Failed to parse GTFS at "${dir}": ${(err as Error).message}`)
      return null
    }
  }
}
