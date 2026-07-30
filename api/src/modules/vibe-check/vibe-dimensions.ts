// VIBE-CHECK-06 — the "vibe" ranking dimensions, built on the VIBE-01 raw OSM
// fields that were ingested but never scored against anything.
//
// Why this exists: the four livability dimensions (walkability, schools,
// amenities, transit) are all density proxies and all point the same way —
// dense urban cores score high on every one of them. So no matter how the quiz
// reweighted those four, the ranking collapsed to "highest overall livability"
// and Downtown Vancouver won nearly every quiz, including the nature-lover
// ones. Differentiation needs dimensions that genuinely *oppose* density, which
// is exactly what greenCoverPct / bikeLaneKm / nearest{MajorRoad,Rail}M give us.
//
// Deliberately local to the vibe-check module rather than added to
// scoring/blend.ts: that blend is the canonical livability score shown on the
// neighbourhood page and used by personalization, and it must not shift because
// the quiz needed more axes.

import { LivabilityWeights, SubScores } from '../neighbourhoods/scoring/blend'
import { FlavorSignals } from './types'

export type VibeDimension = keyof LivabilityWeights | 'green' | 'quiet' | 'bike'

export type VibeWeights = Record<VibeDimension, number>
export type VibeScores = Record<VibeDimension, number | null>

// Raw inputs straight off the Neighbourhood row.
export interface VibeRawMetrics {
  greenCoverPct: number | null
  bikeLaneKm: number | null
  nearestMajorRoadM: number | null
  nearestRailM: number | null
}

// Past this distance a noise source stops mattering; `null` means the ingest
// found none within its search radius (see schema VIBE-01), i.e. maximally far.
const NOISE_FULL_DISTANCE_M = 1000
// Roughly the top of the observed range across the launch pool; more cycling
// infrastructure than this doesn't meaningfully feel different.
const BIKE_FULL_SCALE_KM = 20
// A flavour signal at this strength is treated as "they care about this as much
// as anything else they told us" — about two emphatic answers.
const FLAVOR_FULL_SCALE = 6

function noiseDistanceScore(metres: number | null): number {
  if (metres == null) return 100
  return Math.min(metres / NOISE_FULL_DISTANCE_M, 1) * 100
}

/**
 * Quiet is not just "far from a highway" — a dense, amenity-packed street is
 * loud whatever its distance from a rail line. So it blends distance from the
 * mapped noise sources with the *inverse* of amenity density. This is the one
 * dimension that actively penalises bustle, and it's what stops a downtown core
 * from winning a quiz that asked for birdsong.
 */
function quietScore(raw: VibeRawMetrics, amenities: number | null): number {
  const road = noiseDistanceScore(raw.nearestMajorRoadM)
  const rail = noiseDistanceScore(raw.nearestRailM)
  const calm = amenities == null ? 50 : 100 - amenities
  return road * 0.35 + rail * 0.2 + calm * 0.45
}

export function toVibeScores(sub: SubScores, raw: VibeRawMetrics): VibeScores {
  return {
    ...sub,
    green: raw.greenCoverPct,
    quiet: quietScore(raw, sub.amenities),
    bike: raw.bikeLaneKm == null ? null : Math.min(raw.bikeLaneKm / BIKE_FULL_SCALE_KM, 1) * 100,
  }
}

/**
 * Folds the quiz's flavour signals in alongside the four core weights.
 *
 * The core vector already sums to 1. Each flavour dimension is added at its own
 * expressed intensity (0–1) as additional raw weight, then everything is
 * renormalised — so answering nothing but flavour questions puts roughly
 * two-thirds of the total weight on green/quiet/bike, while answering none of
 * them collapses exactly back to the previous four-dimension behaviour.
 */
export function toVibeWeights(core: LivabilityWeights, flavors: FlavorSignals): VibeWeights {
  const intensity = (signal: number) => Math.min(signal / FLAVOR_FULL_SCALE, 1)

  const raw: VibeWeights = {
    ...core,
    green: intensity(flavors.green),
    quiet: intensity(flavors.quiet),
    bike: intensity(flavors.bikeLane),
  }

  const total = Object.values(raw).reduce((sum, w) => sum + w, 0)
  if (total === 0) return raw

  return Object.fromEntries(
    (Object.keys(raw) as VibeDimension[]).map((dim) => [dim, raw[dim] / total]),
  ) as VibeWeights
}

/**
 * Which dimensions the answers actually asked for, as opposed to sat at their
 * default. scoreQuizAnswers starts every core dimension at the same baseline,
 * so a core dimension only counts as expressed once it rises above an even
 * split of the four; a flavour dimension counts as soon as it registers at all.
 */
export function expressedDimensions(
  core: LivabilityWeights,
  flavors: FlavorSignals,
): ReadonlySet<VibeDimension> {
  const evenShare = 1 / Object.keys(core).length
  const expressed = new Set<VibeDimension>()

  for (const dim of Object.keys(core) as (keyof LivabilityWeights)[]) {
    if (core[dim] > evenShare + 1e-6) expressed.add(dim)
  }
  if (flavors.green > 0) expressed.add('green')
  if (flavors.quiet > 0) expressed.add('quiet')
  if (flavors.bikeLane > 0) expressed.add('bike')

  return expressed
}

/**
 * Weighted mean over the dimensions that have data, same contract as
 * blendLivability. Null dimensions are dropped rather than reweighted onto the
 * rest — the caller is expected to have already excluded candidates missing a
 * dimension the user materially cares about.
 */
export function blendVibe(scores: VibeScores, weights: VibeWeights): number | null {
  let weightSum = 0
  let acc = 0
  for (const dim of Object.keys(weights) as VibeDimension[]) {
    const value = scores[dim]
    if (value == null) continue
    weightSum += weights[dim]
    acc += weights[dim] * value
  }
  if (weightSum === 0) return null
  return acc / weightSum
}
