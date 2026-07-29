// VIBE-CHECK-02 — turns a scored quiz result into one of the 9 `ArchetypeKey`s
// (PRD §7). Pure function, no NestJS/Prisma — same "pure logic" split as
// `blend.ts`/`score-quiz-answers.ts` so it can be unit tested without a DB.
//
// THE AMBIGUITY (documented per the parent task's request): PRD §7's
// "signature" column mixes two incompatible kinds of signal —
//   (a) core LivabilityWeights dominance (walkability/schools/amenities/transit)
//   (b) flavor dominance (`Quiet`, `Green`, `housingEra`) that isn't part of
//       LivabilityWeights at all (`quiet`/`green`/`housingEra*` only exist in
//       `FlavorSignals`, see types.ts).
// and two archetype pairs are literally identical on the core-dimension axis:
//   - cafe-hopping-urbanite & everything-in-reach-local: both "Amenities +++,
//     Walkability +++"
//   - transit-maximalist & downtown-commuter: both lead with "Transit +++"
// The PRD itself calls this fuzzy ("ties default to the archetype whose
// signature most overlaps..."), so the procedure below is a deliberate,
// documented judgment call, not a literal transcription of §7.
//
// DECISION PROCEDURE (three ordered stages, first match wins):
//
// Stage 1 — housing-era gate. Q6 is the *only* question that touches
// housingEraOlder/Newer, and picking "character heritage house" or "sleek
// new-build" is about as explicit a personality signal as an 11-question quiz
// gets. It pre-empts the core-dimension default, but only when schools/transit
// isn't already the clear core-dominant dimension — heritage-homebody and
// new-build-minimalist's own §7 signatures never mention schools or transit,
// so a Family Basecamp or Transit Maximalist quiz-taker who happened to also
// like heritage homes should stay Family Basecamp/Transit Maximalist.
//
// Stage 2 — quiet/green "character" archetypes. `quiet` and `green` aren't
// core dimensions, so they only get to override the core-dominant pick when
// the core weights are close to flat (no dimension meaningfully stands out —
// `coreSpread` near 0), i.e. the user's answers were mostly flavor questions
// (bonfire/birdsong/trail-run/dead-quiet/WFH) rather than core-dimension ones.
// A user who is clearly Family Basecamp or Downtown Commuter on the core
// weights shouldn't get bumped to Quiet Introvert just for a couple of
// incidental quiet-flavored answers.
//
// Stage 3 — core-dimension default, the primary path for most quiz-takers
// (matches the parent task's brief: "dominant weight dimension is the primary
// signal"). Schools and transit each map to one non-ambiguous archetype
// (transit further split by whether walkability is the runner-up, mirroring
// the Transit Maximalist vs. Downtown Commuter split above). Walkability/
// amenities dominance is the identical-signature pair from above, broken by
// comparing amenities vs. walkability directly: amenities-leaning reads as
// going-out/café culture ("coffee, dinner, culture" — Café-Hopping Urbanite),
// walkability-leaning reads as self-sufficient "15-minute world" (Everything-
// in-Reach Local, whose own tagline uses that exact phrase).

import { LivabilityWeights } from '../neighbourhoods/scoring/blend'
import { ArchetypeKey, Dimension, FlavorSignals } from './types'

// Same order used throughout the vibe-check/blend code (score-quiz-answers.ts,
// blend.ts) — reused here so ties resolve the same deterministic way.
const DIMENSIONS: Dimension[] = ['walkability', 'schools', 'amenities', 'transit']

// A flavor value below this is treated as "not really part of their answers" —
// noise from a single incidental delta rather than a real preference. Housing
// era deltas are always exactly 2 or 0 (Q6 is the only contributor), so this
// threshold only matters for quiet/green, which accumulate across up to 6
// questions each.
const FLAVOR_PRESENT = 2

// How far the leading core dimension sits above a perfectly flat 0.25 each.
// Below this, no core dimension is a meaningful signal on its own.
const FLAT_CORE_SPREAD = 0.1

function dominantDimension(weights: LivabilityWeights): Dimension {
  return DIMENSIONS.reduce((best, dim) => (weights[dim] > weights[best] ? dim : best))
}

// Returns null when there's no single clear runner-up (e.g. all three
// remaining dimensions are still sitting at the baseline because the quiz
// answers only ever touched `exclude`) — a tie shouldn't be silently resolved
// to whichever dimension happens to sort first, since that's exactly the case
// that needs to fall through to the "no secondary signal" default below.
function secondDimension(weights: LivabilityWeights, exclude: Dimension): Dimension | null {
  const rest = DIMENSIONS.filter((d) => d !== exclude)
  const max = Math.max(...rest.map((d) => weights[d]))
  const leaders = rest.filter((d) => weights[d] === max)
  return leaders.length === 1 ? leaders[0] : null
}

export function assignArchetypeKey(weights: LivabilityWeights, flavors: FlavorSignals): ArchetypeKey {
  const dominant = dominantDimension(weights)
  const second = secondDimension(weights, dominant)
  const coreLeaderIsSchoolsOrTransit = dominant === 'schools' || dominant === 'transit'

  // Stage 1 — housing era.
  const hasHeritage = flavors.housingEraOlder > flavors.housingEraNewer && flavors.housingEraOlder > 0
  const hasNewBuild = flavors.housingEraNewer > flavors.housingEraOlder && flavors.housingEraNewer > 0

  if (hasHeritage && !coreLeaderIsSchoolsOrTransit && flavors.quiet >= flavors.green) {
    return 'heritage-homebody'
  }
  if (hasNewBuild && !coreLeaderIsSchoolsOrTransit) {
    return 'new-build-minimalist'
  }

  // Stage 2 — quiet/green character archetypes, only when the core weights
  // don't already point somewhere clear.
  const coreSpread = weights[dominant] - 0.25
  const isQuiet = flavors.quiet >= FLAVOR_PRESENT
  const isGreen = flavors.green >= FLAVOR_PRESENT
  if (coreSpread < FLAT_CORE_SPREAD && (isQuiet || isGreen)) {
    return flavors.green > flavors.quiet ? 'trailhead-local' : 'quiet-introvert'
  }

  // Stage 3 — core-dimension default.
  switch (dominant) {
    case 'schools':
      return 'family-basecamp'
    case 'transit':
      return second === 'walkability' ? 'downtown-commuter' : 'transit-maximalist'
    case 'walkability':
    case 'amenities':
    default:
      return weights.amenities > weights.walkability ? 'cafe-hopping-urbanite' : 'everything-in-reach-local'
  }
}
