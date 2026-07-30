// VIBE-CHECK-05 — derives an ordered lifestylePriorities subset (see
// preference-profile.util.ts's LIFESTYLE enum: schools|commute|transit|parks|
// dining|walkability|quiet) from a scored vibe-check result, so a
// signup-from-quiz user's onboarding can be pre-filled instead of asking the
// same questions twice (PRD §8). Pure function, no NestJS/Prisma — same split
// as archetype-matching.ts/score-quiz-answers.ts.
//
// MAPPING (documented per the parent task's request, same spirit as
// archetype-matching.ts's own tie-break writeup):
//
//  - walkability -> 'walkability' (direct, same dimension name both sides)
//  - schools     -> 'schools' (direct)
//  - transit     -> 'commute' — the quiz's `transit` core dimension is scored
//    from "how do you get around without a car" answers (Q2 bus/train, Q11
//    commute-downtown, the Q1/Q4 transit flavor bumps), which reads as
//    onboarding's "commute" tile, not its separate "transit" tile (closer to
//    "proximity to a stop" specifically). The quiz never distinguishes the
//    two, so this is a deliberate one-way collapse onto 'commute'.
//  - amenities   -> ambiguous in onboarding's vocabulary between 'parks'
//    (green/outdoorsy amenities) and 'dining' (café/restaurant amenities).
//    Disambiguated by the `green` flavor signal (Q3 trail-run, Q4 birdsong,
//    Q5 highway-dealbreaker, Q10 weekend-drive): `green >= GREEN_THRESHOLD`
//    -> 'parks', else -> 'dining'. GREEN_THRESHOLD mirrors archetype-matching
//    .ts's own FLAVOR_PRESENT threshold (2) — one moderate-or-stronger green
//    answer reads as "outdoorsy," not just incidental.
//
// ORDERING: the four dims above are ranked by their scoreQuizAnswers weight,
// descending — the highest-weighted dimension is the user's #1 priority,
// matching lifestylePriorities' own documented "ordered, first = highest
// priority" contract. Ties (e.g. a quiz answered with mostly flavor
// questions, leaving several dims at/near baseline) resolve to a stable,
// deterministic order — walkability, schools, commute, then the
// amenities-derived key — since Array.sort is stable and that's this
// function's declared base order below.
//
// 'quiet' isn't one of the four core dimensions (PRD §6.2 — flavor/tiebreak
// only), so it can't be ranked by weight the same way. It's appended at the
// end of the list, and only when the `quiet` flavor signal clears
// QUIET_THRESHOLD — roughly two quiet-leaning answers, not just one
// incidental "home by 8." A weak/single quiet answer is left out entirely
// rather than silently outranking dims the user gave real weight to.

import { LivabilityWeights } from '../neighbourhoods/scoring/blend'
import { FlavorSignals } from './types'

const GREEN_THRESHOLD = 2
const QUIET_THRESHOLD = 4

export function deriveLifestylePriorities(weights: LivabilityWeights, flavors: FlavorSignals): string[] {
  const amenitiesPriority = flavors.green >= GREEN_THRESHOLD ? 'parks' : 'dining'

  const ranked = [
    { priority: 'walkability', weight: weights.walkability },
    { priority: 'schools', weight: weights.schools },
    { priority: 'commute', weight: weights.transit },
    { priority: amenitiesPriority, weight: weights.amenities },
  ]
    .sort((a, b) => b.weight - a.weight)
    .map((r) => r.priority)

  if (flavors.quiet >= QUIET_THRESHOLD) ranked.push('quiet')

  return ranked
}
