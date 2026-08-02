// Non-linear price ladders for the price range slider.
//
// A linear slider is unusable across a real-estate price range: at $25K steps
// over $0–10M, the band most listings actually sit in ($300K–$2M) occupies the
// first fifth of the track, so a one-pixel drag jumps $50K where precision
// matters most and crawls where it doesn't.
//
// Instead the slider runs in *index space* — `min=0, max=STOPS.length-1,
// step=1` — and each index maps to a stop on a ladder that coarsens as the
// numbers grow. Even drag distance, meaningful values everywhere.

import { formatPriceCompact } from './format'

/** Each band extends the ladder up to `to`, adding a stop every `step`. */
interface Band {
  to: number
  step: number
}

function buildStops(bands: Band[]): number[] {
  const stops = [0]
  let current = 0
  for (const band of bands) {
    while (current < band.to) {
      current += band.step
      stops.push(current)
    }
  }
  return stops
}

/** $0–300K by $50K, then $100K to $1M, $250K to $2M, $500K to $5M, $1M to $10M. */
export const SALE_STOPS = buildStops([
  { to: 300_000, step: 50_000 },
  { to: 1_000_000, step: 100_000 },
  { to: 2_000_000, step: 250_000 },
  { to: 5_000_000, step: 500_000 },
  { to: 10_000_000, step: 1_000_000 },
])

/** $0–3K by $100, then $250 to $6K, $500 to $10K, $1K to $15K. */
export const RENT_STOPS = buildStops([
  { to: 3_000, step: 100 },
  { to: 6_000, step: 250 },
  { to: 10_000, step: 500 },
  { to: 15_000, step: 1_000 },
])

export const stopsFor = (isRent: boolean): number[] => (isRent ? RENT_STOPS : SALE_STOPS)

/** Ladder index whose stop is closest to `value` — ties round down. */
export function nearestIndex(stops: number[], value: number): number {
  let best = 0
  let bestDistance = Infinity
  for (let i = 0; i < stops.length; i++) {
    const distance = Math.abs(stops[i] - value)
    // Strict `<` keeps the lower of two equidistant stops.
    if (distance < bestDistance) {
      bestDistance = distance
      best = i
    }
  }
  return best
}

/**
 * Trigger-button summary, e.g. "$150k – $2M", "$500k+", "Up to $1M".
 * Compact on purpose — it has to fit a filter pill.
 */
export function formatPriceRange(
  min: number | null,
  max: number | null,
  isRent = false,
): string | null {
  if (min === null && max === null) return null
  const suffix = isRent ? '/mo' : ''
  if (min !== null && max !== null) {
    return `${formatPriceCompact(min)} – ${formatPriceCompact(max)}${suffix}`
  }
  if (min !== null) return `${formatPriceCompact(min)}+${suffix}`
  return `Up to ${formatPriceCompact(max as number)}${suffix}`
}
