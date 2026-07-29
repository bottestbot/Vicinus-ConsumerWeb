import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { blendLivability, LivabilityWeights, SubScores } from '../neighbourhoods/scoring/blend'
import { QUIZ_QUESTIONS } from './quiz-questions.data'
import { VIBE_ARCHETYPES } from './vibe-archetypes.data'
import { scoreQuizAnswers } from './score-quiz-answers'
import { assignArchetypeKey } from './archetype-matching'
import { generateToken } from './short-id.util'
import { SubmitVibeCheckDto } from './dto/submit-vibe-check.dto'
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
  runnerUps: { name: string; matchPercent: number }[]
  accentColour: 'lime-forest'
}

const SHORT_ID_LENGTH = 7
const REFERRAL_CODE_LENGTH = 10
const MAX_ID_ATTEMPTS = 5

// Same STRONG/GOOD language as personalization.service.ts's reasonChips, kept
// in sync deliberately — a neighbourhood shouldn't read as "excellent
// walkability" on one surface and merely "good" on another.
const STRONG = 70
const GOOD = 55
const DIMENSION_LABEL: Record<keyof SubScores, string> = {
  walkability: 'walkability',
  schools: 'school access',
  amenities: 'local amenities',
  transit: 'transit access',
}

interface RankedNeighbourhood {
  id: string
  name: string
  city: string | null
  sub: SubScores
  score: number
}

@Injectable()
export class VibeCheckService {
  constructor(private readonly prisma: PrismaService) {}

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

    const ranked = await this.rankNeighbourhoods(weights)
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
      reasonChips: this.reasonChips(top.sub),
      matchRarityPct: null,
      runnerUps: runnersUp.map((n) => ({ name: n.name, matchPercent: n.score })),
      accentColour: 'lime-forest',
    }
  }

  private async rankNeighbourhoods(weights: LivabilityWeights): Promise<RankedNeighbourhood[]> {
    const rows = await this.prisma.neighbourhood.findMany({
      select: {
        id: true,
        name: true,
        city: true,
        walkabilityScore: true,
        schoolsScore: true,
        amenitiesScore: true,
        transitSubScore: true,
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
      const blended = blendLivability(sub, weights)
      // blendLivability returns null only when every sub-score is null (PRD
      // §6.5 handles the *partial* null case — transit outside the 10 GTFS
      // cities — via blend.ts's own proportional reweighting, so this only
      // excludes neighbourhoods with literally no score data at all).
      if (blended == null) continue
      ranked.push({ id: row.id, name: row.name, city: row.city, sub, score: Math.round(blended) })
    }

    // Descending by score; stable tie-break on name so re-runs against the
    // same data are reproducible.
    ranked.sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
    return ranked
  }

  private reasonChips(sub: SubScores): string[] {
    const dims: { dim: keyof SubScores; score: number | null }[] = [
      { dim: 'walkability', score: sub.walkability },
      { dim: 'schools', score: sub.schools },
      { dim: 'amenities', score: sub.amenities },
      { dim: 'transit', score: sub.transit },
    ]
    return dims
      .filter((d) => d.score != null && d.score >= GOOD)
      .sort((a, b) => (b.score as number) - (a.score as number))
      .slice(0, 4)
      .map((d) => {
        const qualifier = (d.score as number) >= STRONG ? 'Excellent' : 'Good'
        return `${qualifier} ${DIMENSION_LABEL[d.dim]}`
      })
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
