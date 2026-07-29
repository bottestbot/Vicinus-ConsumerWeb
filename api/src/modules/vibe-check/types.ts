// VIBE-01 — shared types for the Neighbourhood Vibe Check quiz engine.
// Pure data/logic module: no NestJS, no Prisma, no DB access. See
// NEIGHBOURHOOD_VIBE_CHECK_PRD.md §5-§7 for the source spec.

import { LivabilityWeights } from '../neighbourhoods/scoring/blend'

export type Dimension = keyof LivabilityWeights

// Raw "vibe" fields (bikeLaneKm, greenCoverPct, nearestMajorRoadM,
// nearestRailM/nearestAirportM, housingAge) aren't part of the core livability
// blend, so they're tracked separately and only ever feed archetype
// tiebreaking + reason chips (PRD §6.2).
export type FlavorKey =
  | 'green'
  | 'quiet'
  | 'bikeLane'
  | 'housingEraOlder'
  | 'housingEraNewer'
  | 'airport'

export type FlavorSignals = Record<FlavorKey, number>

export interface QuizAnswerOption {
  id: string
  text: string
  dimensionDeltas?: Partial<Record<Dimension, number>>
  flavorDeltas?: Partial<Record<FlavorKey, number>>
}

export interface QuizQuestion {
  id: string
  text: string
  options: QuizAnswerOption[]
}

export interface QuizScoreResult {
  weights: LivabilityWeights
  flavors: FlavorSignals
}

export type ArchetypeKey =
  | 'cafe-hopping-urbanite'
  | 'transit-maximalist'
  | 'trailhead-local'
  | 'heritage-homebody'
  | 'family-basecamp'
  | 'new-build-minimalist'
  | 'everything-in-reach-local'
  | 'quiet-introvert'
  | 'downtown-commuter'

export interface VibeArchetype {
  key: ArchetypeKey
  name: string
  tagline: string
  signature: string
  colour: string
  icon: string
}
