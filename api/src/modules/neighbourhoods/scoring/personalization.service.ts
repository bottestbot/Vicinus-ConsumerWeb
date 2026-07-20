import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../prisma/prisma.service'
import { blendLivability, DEFAULT_WEIGHTS, LivabilityWeights, SubScores } from './blend'

export interface PersonalizationResult {
  matchPercent: number | null
  reasonChips: string[]
  cautionChips: string[]
  isPersonalized: boolean
}

// NBHD-08 — deterministic personalization for v1 (no LLM synthesis yet).
// Maps the user's stated lifestyle priorities to livability weights, recomputes
// the composite as a "match %", and emits transparent reason/caution chips from
// the sub-scores. LLM-generated copy is a later AI release.
type Dimension = keyof LivabilityWeights

// Onboarding priority keys (User.onboardingData.lifestylePriorities) → the
// livability dimension each maps to. There is no dedicated "amenities" key, so
// dining/parks feed amenities; commute/transit feed transit.
const PRIORITY_TO_DIMENSION: Record<string, Dimension> = {
  walkability: 'walkability',
  schools: 'schools',
  transit: 'transit',
  commute: 'transit',
  dining: 'amenities',
  parks: 'amenities',
}

// Small non-zero baseline so an un-prioritised dimension still contributes a
// little (and the blend never divides by zero).
const BASELINE = 0.05
const STRONG = 70 // sub-score at/above this → a positive reason chip
const GOOD = 55
const WEAK = 40 // sub-score below this on a prioritised dimension → caution chip

const DIMENSION_LABEL: Record<Dimension, string> = {
  walkability: 'walkability',
  schools: 'school access',
  amenities: 'local amenities',
  transit: 'transit access',
}

@Injectable()
export class PersonalizationService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * @param sub  the neighbourhood's stored sub-scores
   * @param clerkId  the signed-in user's Clerk id (undefined ⇒ cold-start)
   */
  async personalize(sub: SubScores, clerkId?: string): Promise<PersonalizationResult> {
    const priorities = clerkId ? await this.loadPriorities(clerkId) : []
    const isPersonalized = priorities.length > 0
    const weights = isPersonalized ? weightsFromPriorities(priorities) : DEFAULT_WEIGHTS

    const match = blendLivability(sub, weights)
    const matchPercent = match == null ? null : Math.round(match)

    return {
      matchPercent,
      reasonChips: reasonChips(sub),
      cautionChips: cautionChips(sub, isPersonalized ? priorities : []),
      isPersonalized,
    }
  }

  private async loadPriorities(clerkId: string): Promise<string[]> {
    const user = await this.prisma.user.findUnique({
      where: { clerkId },
      select: { onboardingData: true },
    })
    const data = user?.onboardingData
    if (!data || typeof data !== 'object') return []
    const raw = (data as Record<string, unknown>)['lifestylePriorities']
    if (!Array.isArray(raw)) return []
    return raw.filter((p): p is string => typeof p === 'string')
  }
}

// Ordered priorities → normalized weight vector. Earlier priorities carry more
// weight (rank points = list.length - index), added on top of a small baseline.
function weightsFromPriorities(priorities: string[]): LivabilityWeights {
  const raw: LivabilityWeights = {
    walkability: BASELINE,
    schools: BASELINE,
    amenities: BASELINE,
    transit: BASELINE,
  }
  priorities.forEach((priority, index) => {
    const dimension = PRIORITY_TO_DIMENSION[priority]
    if (!dimension) return
    raw[dimension] += priorities.length - index
  })

  const total = raw.walkability + raw.schools + raw.amenities + raw.transit
  return {
    walkability: raw.walkability / total,
    schools: raw.schools / total,
    amenities: raw.amenities / total,
    transit: raw.transit / total,
  }
}

function reasonChips(sub: SubScores): string[] {
  const dims: { dim: Dimension; score: number | null }[] = [
    { dim: 'walkability', score: sub.walkability },
    { dim: 'schools', score: sub.schools },
    { dim: 'amenities', score: sub.amenities },
    { dim: 'transit', score: sub.transit },
  ]
  return dims
    .filter((d) => d.score != null && d.score >= GOOD)
    .sort((a, b) => (b.score as number) - (a.score as number))
    .slice(0, 3)
    .map((d) => {
      const qualifier = (d.score as number) >= STRONG ? 'Excellent' : 'Good'
      return `${qualifier} ${DIMENSION_LABEL[d.dim]}`
    })
}

// At most one caution — prefer a weak dimension the user actually prioritised.
function cautionChips(sub: SubScores, priorities: string[]): string[] {
  const prioritisedDims = new Set(
    priorities.map((p) => PRIORITY_TO_DIMENSION[p]).filter((d): d is Dimension => Boolean(d)),
  )
  const dims: { dim: Dimension; score: number | null }[] = [
    { dim: 'walkability', score: sub.walkability },
    { dim: 'schools', score: sub.schools },
    { dim: 'amenities', score: sub.amenities },
    { dim: 'transit', score: sub.transit },
  ]
  const weak = dims.filter((d) => d.score != null && d.score < WEAK)
  if (weak.length === 0) return []
  const prioritisedWeak = weak.find((d) => prioritisedDims.has(d.dim))
  const chosen = prioritisedWeak ?? weak.sort((a, b) => (a.score as number) - (b.score as number))[0]
  return [`Limited ${DIMENSION_LABEL[chosen.dim]}`]
}
