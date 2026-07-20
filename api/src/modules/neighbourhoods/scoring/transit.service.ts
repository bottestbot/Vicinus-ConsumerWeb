import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { access } from 'node:fs/promises'
import { LatLng } from './geo'

export interface TransitResult {
  score: number | null
  source: 'gtfs' | 'unavailable'
}

// NBHD-05 — transit sub-score from agency GTFS (TransLink / BC Transit).
// Decision (2026-07-20): build from agency GTFS, no paid Transit Score API.
// v1 has no feed wired, so this returns `null` (source: 'unavailable') and the
// livability blend redistributes transit's weight. When a GTFS zip/dir path is
// configured the feed is validated but full parsing (stops.txt + stop_times.txt
// → trips/day per stop, distance-decayed from the centroid) is deferred.
@Injectable()
export class TransitService {
  private readonly logger = new Logger(TransitService.name)

  constructor(private readonly config: ConfigService) {}

  async score(centroid: LatLng): Promise<TransitResult> {
    const gtfsPath =
      this.config.get<string>('TRANSLINK_GTFS_PATH') ??
      this.config.get<string>('BC_TRANSIT_GTFS_PATH')

    // TODO: add GTFS feed path to env (TRANSLINK_GTFS_PATH or BC_TRANSIT_GTFS_PATH)
    if (!gtfsPath) {
      this.logger.warn('No GTFS feed path configured — transit score unavailable')
      return { score: null, source: 'unavailable' }
    }

    try {
      await access(gtfsPath)
    } catch {
      this.logger.warn(`GTFS path "${gtfsPath}" not accessible — transit score unavailable`)
      return { score: null, source: 'unavailable' }
    }

    // TODO: parse GTFS (stops.txt + stop_times.txt) into trips/day per stop and
    // compute a 0-100 sub-score via distance-decay from `centroid` with
    // diminishing returns, normalized against a fixed anchor. Not implemented in v1.
    this.logger.warn(
      `GTFS feed present at "${gtfsPath}" but parsing is not implemented in v1 ` +
        `(centroid ${centroid.lat},${centroid.lng}) — transit score unavailable`,
    )
    return { score: null, source: 'unavailable' }
  }
}
