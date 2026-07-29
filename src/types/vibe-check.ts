// Neighbourhood Vibe Check — result payload shape (see NEIGHBOURHOOD_VIBE_CHECK_PRD.md §6-7).
// This is the contract the result-card UI renders against. The scoring/matching
// engine is being built in parallel; once it lands, swapping the mock fixture in
// src/lib/vibe-check/fixtures.ts for a real API call is the only change needed —
// VibeCheckResultCard only ever consumes this type.

export interface VibeCheckMatchedNeighbourhood {
  name: string
  city: string
}

export interface VibeCheckRunnerUp {
  name: string
  matchPercent: number
}

// Each of the 9 archetypes gets its own accent colour (PRD §7). Only the
// approved "transit maximalist" (lime/forest) scheme is implemented today —
// add the rest here as their palettes get product sign-off.
export type VibeArchetypeColourKey = 'lime-forest'

export interface VibeCheckResult {
  shortId: string
  archetypeKey: string
  archetypeName: string
  tagline: string
  matchedNeighbourhood: VibeCheckMatchedNeighbourhood
  matchPercent: number
  reasonChips: string[]
  matchRarityPct: number
  runnerUps: VibeCheckRunnerUp[]
  accentColour: VibeArchetypeColourKey
}
