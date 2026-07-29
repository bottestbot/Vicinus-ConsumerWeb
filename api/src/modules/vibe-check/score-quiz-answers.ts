// VIBE-04 — turns a set of chosen answer ids into a `LivabilityWeights`
// vector, mirroring `weightsFromPriorities` in personalization.service.ts:
// start every core dimension at a small baseline (so the blend never divides
// by zero and an unmentioned dimension still contributes a little), accumulate
// deltas, then normalize to sum 1. Flavor deltas accumulate the same way but
// are returned unnormalized — they're a tiebreak/reason-chip signal, not a
// blend weight, so there's no "sum to 1" requirement for them.

import { LivabilityWeights } from '../neighbourhoods/scoring/blend'
import { QUIZ_QUESTIONS } from './quiz-questions.data'
import { Dimension, FlavorKey, FlavorSignals, QuizAnswerOption, QuizScoreResult } from './types'

const BASELINE = 0.05

const DIMENSIONS: Dimension[] = ['walkability', 'schools', 'amenities', 'transit']

const FLAVOR_KEYS: FlavorKey[] = [
  'green',
  'quiet',
  'bikeLane',
  'housingEraOlder',
  'housingEraNewer',
  'airport',
]

const ANSWER_BY_ID: Map<string, QuizAnswerOption> = new Map(
  QUIZ_QUESTIONS.flatMap((question) => question.options.map((option) => [option.id, option])),
)

export function scoreQuizAnswers(answerIds: string[]): QuizScoreResult {
  const raw: LivabilityWeights = {
    walkability: BASELINE,
    schools: BASELINE,
    amenities: BASELINE,
    transit: BASELINE,
  }
  const flavors: FlavorSignals = {
    green: 0,
    quiet: 0,
    bikeLane: 0,
    housingEraOlder: 0,
    housingEraNewer: 0,
    airport: 0,
  }

  for (const id of answerIds) {
    const option = ANSWER_BY_ID.get(id)
    if (!option) continue

    for (const dim of DIMENSIONS) {
      const delta = option.dimensionDeltas?.[dim]
      if (delta) raw[dim] += delta
    }
    for (const flavor of FLAVOR_KEYS) {
      const delta = option.flavorDeltas?.[flavor]
      if (delta) flavors[flavor] += delta
    }
  }

  const total = raw.walkability + raw.schools + raw.amenities + raw.transit
  const weights: LivabilityWeights = {
    walkability: raw.walkability / total,
    schools: raw.schools / total,
    amenities: raw.amenities / total,
    transit: raw.transit / total,
  }

  return { weights, flavors }
}
