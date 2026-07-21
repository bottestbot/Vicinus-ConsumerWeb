import { Injectable } from '@nestjs/common'
import {
  distanceDecay,
  LatLng,
  PoiCategory,
  POI_CATEGORIES,
  ScorablePoi,
  walkingMeters,
} from './geo'

export interface WalkabilityResult {
  score: number
  breakdown: Record<PoiCategory, number>
}

// NBHD-04 — JS walkability approximation for v1 (no osmnx/pandana network
// analysis yet). Full credit within a short walk (≤400m), decaying to zero at
// 2400m. Counts hit diminishing returns via log(1+count) so the 8th café adds
// far less than the 1st. Category weights bias the composite toward the things
// that matter most for daily errands.
const FULL_CREDIT_M = 400
const ZERO_CREDIT_M = 2400

const CATEGORY_WEIGHTS: Record<PoiCategory, number> = {
  grocery: 1.5,
  restaurants: 1.2,
  parks: 1.0,
  schools: 1.0,
  banks: 0.8,
  healthcare: 0.8,
  errands: 1.0,
  entertainment: 0.8,
  coffee: 1.0,
}

// Per-category cap on the decayed count fed into log() — stops a POI-dense
// category from dominating and keeps each category's raw contribution bounded.
const CATEGORY_COUNT_CAP = 10

// Normalization anchor = the maximum attainable weighted-log total (every
// category saturated at the cap), so a score is the fraction of the best
// possible outcome. Derived rather than hand-tuned: an earlier fixed guess of
// 14 was below the real ceiling of ~21.8, which pinned every urban
// neighbourhood at exactly 100 and made the livability percentile meaningless.
// Measured against real Overpass data this spreads ~11 (remote) to 100 (dense
// urban core). Keep it derived so changing weights or the cap can't silently
// re-saturate the scale.
const NORMALIZATION_ANCHOR =
  Math.log(1 + CATEGORY_COUNT_CAP) *
  Object.values(CATEGORY_WEIGHTS).reduce((sum, w) => sum + w, 0)

@Injectable()
export class WalkabilityService {
  /**
   * @param pois  raw POIs for the neighbourhood (from NeighbourhoodPoi)
   * @param centroid  neighbourhood centroid the walk distances are measured from
   */
  score(pois: ScorablePoi[], centroid: LatLng): WalkabilityResult {
    // Accumulate decayed "presence" per category.
    const decayedByCategory: Record<PoiCategory, number> = emptyCategoryMap()
    for (const poi of pois) {
      const category = poi.category as PoiCategory
      if (!(category in decayedByCategory)) continue
      const meters = walkingMeters(centroid, poi)
      decayedByCategory[category] += distanceDecay(meters, FULL_CREDIT_M, ZERO_CREDIT_M)
    }

    const breakdown = emptyCategoryMap()
    let weightedTotal = 0
    for (const category of POI_CATEGORIES) {
      const capped = Math.min(decayedByCategory[category], CATEGORY_COUNT_CAP)
      // Diminishing returns: the marginal value of each additional POI shrinks.
      const categoryValue = Math.log(1 + capped) * CATEGORY_WEIGHTS[category]
      breakdown[category] = round1((Math.min(categoryValue / Math.log(1 + CATEGORY_COUNT_CAP), 1)) * 100)
      weightedTotal += categoryValue
    }

    const score = clamp0to100((weightedTotal / NORMALIZATION_ANCHOR) * 100)
    return { score: round1(score), breakdown }
  }
}

function emptyCategoryMap(): Record<PoiCategory, number> {
  return POI_CATEGORIES.reduce(
    (acc, c) => {
      acc[c] = 0
      return acc
    },
    {} as Record<PoiCategory, number>,
  )
}

function clamp0to100(n: number): number {
  return Math.max(0, Math.min(100, n))
}

function round1(n: number): number {
  return Math.round(n * 10) / 10
}
