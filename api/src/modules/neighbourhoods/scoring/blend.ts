// Shared livability blend used by both the canonical scorer (NBHD-07, default
// weights) and personalization (NBHD-08, per-user weights).

export interface SubScores {
  walkability: number | null
  schools: number | null
  amenities: number | null
  transit: number | null
}

export interface LivabilityWeights {
  walkability: number
  schools: number
  amenities: number
  transit: number
}

export const WEIGHTS_VERSION = 'v1'

// Canonical NBHD-07 weights: Walk 0.30 · Schools 0.25 · Amenities 0.25 · Transit 0.20.
export const DEFAULT_WEIGHTS: LivabilityWeights = {
  walkability: 0.3,
  schools: 0.25,
  amenities: 0.25,
  transit: 0.2,
}

const DIMENSIONS: (keyof SubScores)[] = ['walkability', 'schools', 'amenities', 'transit']

/**
 * Weighted arithmetic mean of the sub-scores. Any dimension whose sub-score is
 * null (e.g. transit with no GTFS feed) is dropped and its weight redistributed
 * proportionally across the remaining dimensions (renormalize to sum 1).
 * Returns null only when every dimension is null.
 */
export function blendLivability(sub: SubScores, weights: LivabilityWeights): number | null {
  let weightSum = 0
  let acc = 0
  for (const dim of DIMENSIONS) {
    const value = sub[dim]
    if (value == null) continue
    weightSum += weights[dim]
    acc += weights[dim] * value
  }
  if (weightSum === 0) return null
  return Math.round((acc / weightSum) * 10) / 10
}
