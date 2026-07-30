import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { GoogleGenerativeAI, Schema, SchemaType } from '@google/generative-ai'
import { RedisService } from '../../common/redis/redis.service'
import type { BriefFacts, BriefHighlight, BriefHighlightKind } from './brief.types'

const COPY_TTL = 6 * 60 * 60 // ~6 hours

// COMPLIANCE (CREA DDF): the weekly brief must NOT send DDF listing data
// (addresses, list prices) to a third-party LLM. The copy is therefore generated
// deterministically from the facts object via `template()` — no external call,
// no data egress. The Gemini path below is retained but disabled; only re-enable
// it with a prompt that carries NO DDF-derived fields (see buildPrompt).
const LLM_ENABLED: boolean = false

const COPY_SCHEMA: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    headline: { type: SchemaType.STRING },
    body: { type: SchemaType.STRING },
  },
  required: ['headline', 'body'],
}

export interface BriefCopy {
  headline: string
  body: string
  isFallback: boolean
}

/**
 * BRIEF-07 — Gemini copy generation over a fixed facts object. Follows the
 * AiService pattern (gemini-2.5-flash, JSON responseSchema, Redis-cached).
 *
 * Two hard rules from the spec:
 *  1. The model phrases figures; it never computes them. The prompt says so
 *     explicitly and every number is pre-formatted in the facts payload.
 *  2. A Gemini failure must NOT 500 — it falls back to a templated sentence
 *     built from the SAME facts object and flags `isFallback: true`.
 */
@Injectable()
export class BriefCopyService {
  private readonly logger = new Logger(BriefCopyService.name)
  private readonly genAI: GoogleGenerativeAI | null

  constructor(
    private readonly config: ConfigService,
    private readonly redis: RedisService,
  ) {
    // Deliberately `get`, not `getOrThrow`: a missing/placeholder key must
    // degrade to the template, not crash the module (and lets the fallback path
    // be exercised by unsetting the key).
    const key = this.config.get<string>('GEMINI_API_KEY')
    this.genAI = key && !/placeholder/i.test(key) ? new GoogleGenerativeAI(key) : null
  }

  async generate(facts: BriefFacts): Promise<BriefCopy> {
    // Default path: deterministic, no LLM, no DDF data leaves the system. This
    // is the intended output (not a degraded fallback), so isFallback is false.
    if (!LLM_ENABLED) {
      return { ...this.template(facts), isFallback: false }
    }

    // Cache key includes the latest alert id so copy regenerates only when
    // something actually moved — not on a timer. The forward-looking variant
    // has no alert id, so key off its highlight set (+ TTL handles refresh).
    const signature =
      facts.latestAlertId ??
      (facts.highlights.map((h) => h.listingKey ?? h.id).join(',') || 'empty')
    const cacheKey = `brief:copy:${facts.isEmpty ? 'fwd' : 'alerts'}:${signature}`

    const cached = await this.redis.get(cacheKey)
    if (cached) {
      try {
        const parsed = JSON.parse(cached) as { headline: string; body: string }
        if (parsed?.headline && parsed?.body) {
          return { ...parsed, isFallback: false }
        }
      } catch {
        // fall through to regenerate
      }
    }

    if (!this.genAI) {
      this.logger.warn('GEMINI_API_KEY unset/placeholder — rendering templated brief')
      return { ...this.template(facts), isFallback: true }
    }

    try {
      const model = this.genAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: COPY_SCHEMA,
        },
      })
      const response = await model.generateContent(this.buildPrompt(facts))
      const parsed = JSON.parse(response.response.text()) as {
        headline?: string
        body?: string
      }
      if (!parsed.headline || !parsed.body) {
        throw new Error('Gemini returned an incomplete brief')
      }
      const copy = { headline: parsed.headline.trim(), body: parsed.body.trim() }
      await this.redis.set(cacheKey, JSON.stringify(copy), COPY_TTL)
      return { ...copy, isFallback: false }
    } catch (err) {
      // MUST NOT 500 — degrade to the template built from the same facts.
      this.logger.error(`Gemini brief failed, using template: ${(err as Error).message}`)
      return { ...this.template(facts), isFallback: true }
    }
  }

  // ─── Prompt ───────────────────────────────────────────────────────────────

  private buildPrompt(facts: BriefFacts): string {
    const lines = facts.highlights.map((h) => {
      const sub = h.subLabel ? ` — ${h.subLabel}` : ''
      return `- [${h.kind}] ${h.label}${sub}`
    })

    const dataBlock = lines.length > 0 ? lines.join('\n') : '(no items)'

    if (facts.isEmpty) {
      return `You are writing a short "what's coming up" brief for the dashboard of a premium Canadian real estate platform. The user has had no alerts in the last 7 days, so this is a forward-looking nudge toward upcoming activity in their areas of interest.

Facts you may use (and ONLY these — do not invent, recompute, or alter any figure, address, or count):
Focus neighbourhoods: ${facts.focusNeighbourhoods.join(', ') || '(none specified)'}
Upcoming items:
${dataBlock}

Write:
- "headline": a short, warm 4–7 word line (no numbers unless they appear above).
- "body": 2 sentences pointing the user at what's coming up. If there are no items above, gently encourage saving searches/properties to get tailored updates. Never assert a count or price that is not listed above.

Tone: editorial, calm, premium. Do not mention "Gemini", "AI", or "Vicinus". No emojis.`
    }

    const countBits = Object.entries(facts.counts)
      .filter(([, n]) => n > 0)
      .map(([k, n]) => `${n} ${k.replace('_', ' ')}${n > 1 ? 's' : ''}`)
      .join(', ')

    return `You are writing a "here's what moved this week" brief for the dashboard of a premium Canadian real estate platform, covering the last 7 days.

Facts you may use (and ONLY these — do not invent, recompute, or alter any figure, address, or count; every number below is already correct and final):
Updates in the last 7 days: ${facts.alertCount}
Breakdown: ${countBits || '(none)'}
Top items:
${dataBlock}

Write:
- "headline": a short 4–8 word line summarising the activity.
- "body": 2–3 sentences of fluent prose over the items above. You may reference the specific figures and addresses shown, but only exactly as written. Do not compute new numbers, do not sum prices, do not guess.

Tone: editorial, direct, premium — like a sharp analyst briefing a client. Do not mention "Gemini", "AI", or "Vicinus". No emojis.`
  }

  // ─── Template fallback (built from the SAME facts) ────────────────────────

  private template(facts: BriefFacts): { headline: string; body: string } {
    if (facts.isEmpty) {
      const areas = facts.focusNeighbourhoods
      if (facts.highlights.length === 0) {
        return {
          headline: 'Nothing new this week',
          body: areas.length
            ? `No fresh alerts in ${joinNames(areas)} yet. Save a search or a property and we'll surface tailored updates here.`
            : `You're all caught up. Save a search or a few properties and we'll surface tailored updates here.`,
        }
      }
      return {
        // Only claim "your areas" when there actually are some. With no
        // preferred neighbourhoods the forward-looking highlights are just the
        // soonest open houses/newest listings platform-wide (Chilliwack and
        // Alberta for a Vancouver user), so calling them the reader's own areas
        // asserts a personalization that hasn't happened. The body below and
        // the no-highlights branch above already branch on `areas` this way.
        headline: areas.length ? 'Coming up in your areas' : 'Coming up this week',
        body: `${describeHighlights(facts.highlights)}${
          areas.length ? ` in ${joinNames(areas)}` : ''
        }. Tap through to take a closer look.`,
      }
    }

    const n = facts.alertCount
    const headline =
      n === 1 ? '1 update this week' : `${n} updates this week`

    // Lead with the deterministic breakdown ("761 new listings, 419 open
    // houses, and 48 price drops") and say where it's from — every alert is
    // driven by the user's own saved searches / saved properties — then point
    // at the standout listings.
    const breakdown = formatCounts(facts.counts)
    const count = n.toLocaleString('en-CA')
    const parts: string[] = []
    parts.push(
      breakdown
        ? `In the last 7 days, your saved searches and properties saw ${count} update${n === 1 ? '' : 's'} — ${breakdown}.`
        : `You have ${count} update${n === 1 ? '' : 's'} across your saved searches and properties.`,
    )
    if (facts.highlights.length > 0) {
      parts.push(`Recent highlights include ${describeHighlights(facts.highlights)}. Tap a card to see the details.`)
    }
    return { headline, body: parts.join(' ') }
  }
}

// ─── Deterministic phrasing helpers ─────────────────────────────────────────

/** Fixed order so the breakdown reads naturally regardless of counts-object
 *  key order — "761 new listings, 419 open houses, and 48 price drops". */
const COUNT_ORDER: { key: BriefHighlightKind; noun: string }[] = [
  { key: 'new_listing', noun: 'new listing' },
  { key: 'open_house', noun: 'open house' },
  { key: 'price_drop', noun: 'price drop' },
  { key: 'status_change', noun: 'status change' },
]

/** "761 new listings, 419 open houses, and 48 price drops" — omits zero counts,
 *  pluralises, and thousands-separates. Empty string when nothing moved. */
function formatCounts(counts: Record<BriefHighlightKind, number>): string {
  const parts = COUNT_ORDER.filter(({ key }) => (counts[key] ?? 0) > 0).map(({ key, noun }) => {
    const c = counts[key]
    return `${c.toLocaleString('en-CA')} ${noun}${c === 1 ? '' : 's'}`
  })
  return joinNames(parts)
}

function describeHighlights(highlights: BriefHighlight[]): string {
  // Keep the label/address as-is (matching the CTA chips) rather than
  // lower-casing — "451 63RD, Vancouver", not "451 63rd, vancouver".
  const parts = highlights.map((h) => {
    const where = h.subLabel ? ` on ${h.subLabel}` : ''
    return `${h.label}${where}`
  })
  return joinNames(parts)
}

function joinNames(items: string[]): string {
  if (items.length === 0) return ''
  if (items.length === 1) return items[0]
  if (items.length === 2) return `${items[0]} and ${items[1]}`
  return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`
}
