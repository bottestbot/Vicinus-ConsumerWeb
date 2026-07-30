// VIBE-CHECK-07 — the three little phrases on the share card.
//
// These used to be generated straight off the top sub-scores as "Excellent
// transit access" / "Excellent local amenities", which produced cards that
// argued with themselves: a Quiet Introvert result listing excellent transit
// and nightlife-grade amenity density. Two changes fix that — only surface
// dimensions the quiz says the person actually cares about, and say it the way
// a person would rather than the way a scoring pipeline would.

import { VibeDimension, VibeScores, VibeWeights } from './vibe-dimensions'

// A dimension the user barely weighted has no business explaining their match.
const MIN_WEIGHT = 0.08
// Below this the neighbourhood isn't actually good at the thing, so claiming it
// on a share card would be a lie.
const MIN_SCORE = 55
const MAX_CHIPS = 3

const PHRASES: Record<VibeDimension, { strong: string; good: string }> = {
  walkability: { strong: "Everything's a walk away", good: 'Easy to get around on foot' },
  transit: { strong: 'Transit at your doorstep', good: 'Solid transit links' },
  schools: { strong: 'Top-tier schools nearby', good: 'Good schools close by' },
  amenities: { strong: 'Cafés and shops on every corner', good: 'Plenty to do nearby' },
  green: { strong: 'Green space everywhere you look', good: 'Plenty of trees and parks' },
  quiet: { strong: 'Birdsong over bus noise', good: 'Calmer than the core' },
  bike: { strong: 'Bike lanes for days', good: 'Bike-friendly streets' },
}

const STRONG = 75

/**
 * @param expressed dimensions the quiz answers actually asked for. A dimension
 * left at its default weight isn't a preference, it's the absence of one, and
 * chipping it is how a nature-lover's card ended up boasting about cafés.
 * Falls back to weight alone if the answers expressed nothing at all, so a card
 * is never chipless.
 */
export function buildReasonChips(
  scores: VibeScores,
  weights: VibeWeights,
  expressed: ReadonlySet<VibeDimension>,
): string[] {
  const candidates = (Object.keys(weights) as VibeDimension[])
    .map((dim) => ({ dim, weight: weights[dim], score: scores[dim] }))
    .filter(
      (d): d is { dim: VibeDimension; weight: number; score: number } =>
        d.score != null && d.weight >= MIN_WEIGHT && d.score >= MIN_SCORE,
    )

  const preferred = candidates.filter((d) => expressed.has(d.dim))
  return (preferred.length > 0 ? preferred : candidates)
    // Rank by how much this dimension explains *this* match: what they asked
    // for, weighted by how well the neighbourhood actually delivers it.
    .sort((a, b) => b.weight * b.score - a.weight * a.score)
    .slice(0, MAX_CHIPS)
    .map(({ dim, score }) => (score >= STRONG ? PHRASES[dim].strong : PHRASES[dim].good))
}
