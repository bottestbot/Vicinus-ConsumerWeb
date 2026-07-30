import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { SubScores } from '../neighbourhoods/scoring/blend'
import {
  blendVibe,
  expressedDimensions,
  toVibeScores,
  toVibeWeights,
  VibeDimension,
  VibeScores,
  VibeWeights,
} from './vibe-dimensions'
import { buildReasonChips } from './reason-chips'
import { UsersService } from '../users/users.service'
import { parseOnboardingBlob } from '../brief/preference-profile.util'
import { QUIZ_QUESTIONS } from './quiz-questions.data'
import { VIBE_ARCHETYPES } from './vibe-archetypes.data'
import { scoreQuizAnswers } from './score-quiz-answers'
import { assignArchetypeKey } from './archetype-matching'
import { generateToken } from './short-id.util'
import { deriveLifestylePriorities } from './lifestyle-priorities.util'
import { SubmitVibeCheckDto } from './dto/submit-vibe-check.dto'
import { ClaimVibeCheckDto } from './dto/claim-vibe-check.dto'
import { ArchetypeKey } from './types'

export interface PublicQuizQuestion {
  id: string
  text: string
  options: { id: string; text: string }[]
}

export interface VibeCheckSubmitResponse {
  shortId: string
  archetypeKey: ArchetypeKey
  archetypeName: string
  tagline: string
  matchedNeighbourhood: { name: string; city: string }
  matchPercent: number
  reasonChips: string[]
  matchRarityPct: number | null
  runnerUps: { name: string; city: string; matchPercent: number }[]
  accentColour: 'lime-forest'
}

const SHORT_ID_LENGTH = 7
const REFERRAL_CODE_LENGTH = 10
const MAX_ID_ATTEMPTS = 5

// The launch pool: the 10 Metro Vancouver municipalities covered by the
// TransLink GTFS feed, which is the only region where all four sub-scores are
// actually computed (122 neighbourhoods as of launch). Deliberately an explicit
// city list rather than inferring the pool from `transitSubScore IS NOT NULL` —
// the pool shouldn't silently grow or shrink when scores are recomputed or a
// new GTFS feed is added.
const LAUNCH_CITIES = [
  'Vancouver',
  'Burnaby',
  'Surrey',
  'Richmond',
  'Coquitlam',
  'North Vancouver',
  'New Westminster',
  'West Vancouver',
  'Port Coquitlam',
  'Port Moody',
] as const

// A dimension carrying at least this share of the user's weight is one the
// quiz says they actually care about.
const MATERIAL_WEIGHT = 0.15

// A null dimension must not be a free pass. The blend drops nulls and spreads
// their weight over what's left — right for scoring one place honestly on its
// own page, backwards in a ranked comparison, where the missing score is never
// penalised and simply hands its weight to whatever the candidate happens to be
// good at. Harris Green, Victoria (no transit score, since the GTFS feed is
// Metro Vancouver only) beat Downtown Vancouver on a transit-led quiz for
// exactly this reason. So in ranking, a candidate missing a dimension the user
// actually weights is not a candidate at all.
function missesMaterialDimension(scores: VibeScores, weights: VibeWeights): boolean {
  return (Object.keys(weights) as VibeDimension[]).some(
    (dim) => scores[dim] == null && weights[dim] >= MATERIAL_WEIGHT,
  )
}

interface RankedNeighbourhood {
  id: string
  name: string
  city: string | null
  scores: VibeScores
  score: number
}

@Injectable()
export class VibeCheckService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly users: UsersService,
  ) {}

  getQuestions(): PublicQuizQuestion[] {
    // Drop dimensionDeltas/flavorDeltas — the client only renders/collects ids+text.
    return QUIZ_QUESTIONS.map((q) => ({
      id: q.id,
      text: q.text,
      options: q.options.map((o) => ({ id: o.id, text: o.text })),
    }))
  }

  async submit(dto: SubmitVibeCheckDto): Promise<VibeCheckSubmitResponse> {
    const { weights, flavors } = scoreQuizAnswers(dto.answerIds)
    const vibeWeights = toVibeWeights(weights, flavors)
    const expressed = expressedDimensions(weights, flavors)

    const ranked = await this.rankNeighbourhoods(vibeWeights)
    if (ranked.length === 0) {
      // Every neighbourhood is missing all four sub-scores — shouldn't happen
      // outside a broken seed, but fail loudly rather than persist garbage.
      throw new Error('No scored neighbourhoods available for vibe-check matching')
    }
    // Top match + next 2 for the "unlock more matches" gate (PRD §4/§8) — not
    // the entire ranked list.
    const [top, ...rest] = ranked
    const runnersUp = rest.slice(0, 2)

    const archetypeKey = assignArchetypeKey(weights, flavors)
    const archetype = VIBE_ARCHETYPES[archetypeKey]

    const referredByResultId = await this.resolveReferrer(dto.referredByShortId)

    const [shortId, referralCode] = await Promise.all([
      this.generateUniqueField('shortId', SHORT_ID_LENGTH),
      this.generateUniqueField('referralCode', REFERRAL_CODE_LENGTH),
    ])

    await this.prisma.vibeCheckResult.create({
      data: {
        shortId,
        sessionId: dto.sessionId,
        answers: dto.answerIds,
        archetypeKey,
        matchedNeighbourhoodId: top.id,
        matchPercent: top.score,
        matchRarityPct: null, // VIBE-CHECK-04 — batch job backfills this later, not in scope here
        runnerUpIds: runnersUp.map((n) => n.id),
        referralCode,
        referredByResultId,
      },
    })

    return {
      shortId,
      archetypeKey,
      archetypeName: archetype.name,
      tagline: archetype.tagline,
      matchedNeighbourhood: { name: top.name, city: top.city ?? '' },
      matchPercent: top.score,
      reasonChips: buildReasonChips(top.scores, vibeWeights, expressed),
      matchRarityPct: null,
      // Many BC neighbourhoods share a bare name across cities (17 are named
      // "Downtown" alone) — city is required to tell runner-ups apart on the card.
      runnerUps: runnersUp.map((n) => ({ name: n.name, city: n.city ?? '', matchPercent: n.score })),
      accentColour: 'lime-forest',
    }
  }

  // VIBE-CHECK-05 — merges an anonymous quiz session into the signed-in
  // caller's account (PRD §8/§9's "signup-from-quiz" merge task). Claims every
  // still-unclaimed result for this sessionId (a retake produces a second row
  // with the same sessionId, so this can legitimately be >1), then pre-fills
  // lifestylePriorities from the most recently created of them.
  //
  // Idempotent by construction: an unknown sessionId, or one whose rows are
  // already claimed (userId already set), simply matches zero rows and no-ops
  // — calling this twice, or calling it for a session that never took the
  // quiz, is not an error.
  async claim(clerkId: string, dto: ClaimVibeCheckDto): Promise<{ claimed: number }> {
    const unclaimed = await this.prisma.vibeCheckResult.findMany({
      where: { sessionId: dto.sessionId, userId: null },
      orderBy: { createdAt: 'desc' },
    })
    if (unclaimed.length === 0) return { claimed: 0 }

    const user = await this.users.getMe(clerkId)

    await this.prisma.vibeCheckResult.updateMany({
      where: { id: { in: unclaimed.map((r) => r.id) } },
      data: { userId: user.id },
    })

    // Only pre-fill lifestylePriorities if the user hasn't already set their
    // own through the real onboarding wizard — a quiz-derived guess must
    // never clobber a deliberate wizard choice.
    const existing = parseOnboardingBlob(user.onboardingData as Record<string, unknown> | null)
    if (existing.lifestylePriorities.length === 0) {
      const mostRecent = unclaimed[0] // sorted desc by createdAt above
      const answerIds = Array.isArray(mostRecent.answers) ? (mostRecent.answers as string[]) : []
      const { weights, flavors } = scoreQuizAnswers(answerIds)
      const lifestylePriorities = deriveLifestylePriorities(weights, flavors)
      if (lifestylePriorities.length > 0) {
        await this.users.updateOnboarding(clerkId, { stepData: { lifestylePriorities } })
      }
    }

    return { claimed: unclaimed.length }
  }

  private async rankNeighbourhoods(weights: VibeWeights): Promise<RankedNeighbourhood[]> {
    const rows = await this.prisma.neighbourhood.findMany({
      where: { province: 'BC', city: { in: [...LAUNCH_CITIES] } },
      select: {
        id: true,
        name: true,
        city: true,
        walkabilityScore: true,
        schoolsScore: true,
        amenitiesScore: true,
        transitSubScore: true,
        greenCoverPct: true,
        bikeLaneKm: true,
        nearestMajorRoadM: true,
        nearestRailM: true,
      },
    })

    const ranked: RankedNeighbourhood[] = []
    for (const row of rows) {
      const sub: SubScores = {
        walkability: row.walkabilityScore,
        schools: row.schoolsScore,
        amenities: row.amenitiesScore,
        transit: row.transitSubScore,
      }
      const scores = toVibeScores(sub, row)
      if (missesMaterialDimension(scores, weights)) continue
      const blended = blendVibe(scores, weights)
      if (blended == null) continue
      ranked.push({
        id: row.id,
        name: row.name,
        city: row.city,
        scores,
        score: Math.round(blended),
      })
    }

    // Descending by score; stable tie-break on name so re-runs against the
    // same data are reproducible.
    ranked.sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
    return ranked
  }

  // Reconstructs the same response shape `submit` returns, from a persisted
  // row — recomputing weights/percentages from the stored `answers` rather
  // than persisting them redundantly, since the scoring path is a pure function
  // of (answers, neighbourhood metrics) and reproduces the original numbers.
  async getResultByShortId(shortId: string): Promise<VibeCheckSubmitResponse | null> {
    const row = await this.prisma.vibeCheckResult.findUnique({
      where: { shortId },
      include: {
        matchedNeighbourhood: {
          select: {
            name: true,
            city: true,
            walkabilityScore: true,
            schoolsScore: true,
            amenitiesScore: true,
            transitSubScore: true,
            greenCoverPct: true,
            bikeLaneKm: true,
            nearestMajorRoadM: true,
            nearestRailM: true,
          },
        },
      },
    })
    if (!row) return null

    const runnerUpIds = Array.isArray(row.runnerUpIds) ? (row.runnerUpIds as string[]) : []
    const runnerUpRows = runnerUpIds.length
      ? await this.prisma.neighbourhood.findMany({
          where: { id: { in: runnerUpIds } },
          select: {
            id: true,
            name: true,
            city: true,
            walkabilityScore: true,
            schoolsScore: true,
            amenitiesScore: true,
            transitSubScore: true,
            greenCoverPct: true,
            bikeLaneKm: true,
            nearestMajorRoadM: true,
            nearestRailM: true,
          },
        })
      : []
    // findMany(... in ...) doesn't preserve order — restore the original ranking.
    const orderedRunnerUps = runnerUpIds
      .map((id) => runnerUpRows.find((r) => r.id === id))
      .filter((r): r is (typeof runnerUpRows)[number] => r != null)

    const answerIds = Array.isArray(row.answers) ? (row.answers as string[]) : []
    const { weights, flavors } = scoreQuizAnswers(answerIds)
    const vibeWeights = toVibeWeights(weights, flavors)
    const expressed = expressedDimensions(weights, flavors)
    const archetype = VIBE_ARCHETYPES[row.archetypeKey as ArchetypeKey]
    const matchedScores = this.toVibe(row.matchedNeighbourhood)

    return {
      shortId: row.shortId,
      archetypeKey: row.archetypeKey as ArchetypeKey,
      archetypeName: archetype.name,
      tagline: archetype.tagline,
      matchedNeighbourhood: { name: row.matchedNeighbourhood.name, city: row.matchedNeighbourhood.city ?? '' },
      matchPercent: row.matchPercent,
      reasonChips: buildReasonChips(matchedScores, vibeWeights, expressed),
      matchRarityPct: row.matchRarityPct,
      runnerUps: orderedRunnerUps.map((n) => {
        const blended = blendVibe(this.toVibe(n), vibeWeights)
        return { name: n.name, city: n.city ?? '', matchPercent: blended == null ? 0 : Math.round(blended) }
      }),
      accentColour: 'lime-forest',
    }
  }

  private toVibe(n: {
    walkabilityScore: number | null
    schoolsScore: number | null
    amenitiesScore: number | null
    transitSubScore: number | null
    greenCoverPct: number | null
    bikeLaneKm: number | null
    nearestMajorRoadM: number | null
    nearestRailM: number | null
  }): VibeScores {
    const sub: SubScores = {
      walkability: n.walkabilityScore,
      schools: n.schoolsScore,
      amenities: n.amenitiesScore,
      transit: n.transitSubScore,
    }
    return toVibeScores(sub, n)
  }

  private async resolveReferrer(referredByShortId?: string): Promise<string | null> {
    if (!referredByShortId) return null
    const referrer = await this.prisma.vibeCheckResult.findUnique({
      where: { shortId: referredByShortId },
      select: { id: true },
    })
    // An unknown/stale ref code shouldn't block the quiz — just drop it.
    return referrer?.id ?? null
  }

  private async generateUniqueField(field: 'shortId' | 'referralCode', length: number): Promise<string> {
    for (let attempt = 0; attempt < MAX_ID_ATTEMPTS; attempt++) {
      const candidate = generateToken(length)
      const existing =
        field === 'shortId'
          ? await this.prisma.vibeCheckResult.findUnique({ where: { shortId: candidate }, select: { id: true } })
          : await this.prisma.vibeCheckResult.findUnique({ where: { referralCode: candidate }, select: { id: true } })
      if (!existing) return candidate
    }
    throw new Error(`Failed to generate a unique ${field} after ${MAX_ID_ATTEMPTS} attempts`)
  }
}
