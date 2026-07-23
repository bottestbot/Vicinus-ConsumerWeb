/**
 * BRIEF-01/02 — pure parser that projects the raw onboarding blob
 * (`User.onboardingData`) into the structured `UserPreferenceProfile` shape.
 *
 * The one rule: this is a lossless-by-accumulation projection. `onboardingData`
 * is the source of truth and accumulates every step's data (the wizard PATCHes
 * per-step and merges), so re-parsing the *merged* blob can never null out a
 * field that was previously provided. Every field is optional; an absent key
 * yields `undefined` (leave existing) rather than a wrong default.
 *
 * Keys mirror the wizard literals EXACTLY (see OnboardingWizard.tsx):
 *   goal ∈ buy|sell|rent|exploring
 *   timeline ∈ 3mo|3-6mo|6-12mo|researching
 *   homeType ∈ condo|townhouse|detached|presale|any
 *   lifestylePriorities ⊂ schools|commute|transit|parks|dining|walkability|quiet
 *     (`more` is a dead tile — never persisted)
 *   mortgage ∈ approved|in_progress|not_yet|cash
 *   workingWithRealtor ∈ yes|no|open
 */

const GOALS = ['buy', 'sell', 'rent', 'exploring'] as const
const TIMELINES = ['3mo', '3-6mo', '6-12mo', 'researching'] as const
const HOME_TYPES = ['condo', 'townhouse', 'detached', 'presale', 'any'] as const
const MORTGAGES = ['approved', 'in_progress', 'not_yet', 'cash'] as const
const REALTOR = ['yes', 'no', 'open'] as const
// `more` is intentionally excluded — it is a dead "More Coming Soon" tile.
const LIFESTYLE = [
  'schools',
  'commute',
  'transit',
  'parks',
  'dining',
  'walkability',
  'quiet',
] as const

export interface ParsedPreferenceProfile {
  goal: string | null
  timeline: string | null
  homeType: string | null
  budgetMin: number | null
  budgetMax: number | null
  bedroomsMin: number | null
  mortgage: string | null
  workingWithRealtor: string | null
  openToNearby: boolean | null
  lifestylePriorities: string[]
  neighbourhoods: string[]
}

function pickEnum<T extends readonly string[]>(
  value: unknown,
  allowed: T,
): T[number] | null {
  return typeof value === 'string' && (allowed as readonly string[]).includes(value)
    ? (value as T[number])
    : null
}

/**
 * Parse a budget band DISPLAY string (e.g. "Under $600K", "$600K–$1M", "$2M+")
 * into `{ min, max }` integer dollars. Robust to the dash variant (en-dash vs
 * hyphen) and to spacing by extracting the `$<num><K|M>` tokens rather than
 * matching exact literals. Open-ended bands leave the unbounded side null.
 */
export function parseBudgetBand(
  raw: unknown,
): { min: number | null; max: number | null } {
  if (typeof raw !== 'string' || !raw.trim()) return { min: null, max: null }
  const text = raw.toLowerCase()

  const tokens: number[] = []
  const re = /\$?\s*([\d.]+)\s*(k|m)/g
  let m: RegExpExecArray | null
  while ((m = re.exec(text)) !== null) {
    const n = parseFloat(m[1])
    if (Number.isNaN(n)) continue
    tokens.push(Math.round(n * (m[2] === 'm' ? 1_000_000 : 1_000)))
  }
  if (tokens.length === 0) return { min: null, max: null }

  const hasUnder = /under|below|up to|less than/.test(text)
  const hasPlus = /\+|over|above|more than/.test(text)

  if (tokens.length >= 2) {
    return { min: Math.min(...tokens), max: Math.max(...tokens) }
  }
  // Single token: disambiguate by the "Under"/"+" qualifier.
  const only = tokens[0]
  if (hasUnder) return { min: null, max: only }
  if (hasPlus) return { min: only, max: null }
  // A bare single figure is treated as an exact-ish ceiling target.
  return { min: null, max: only }
}

/** Parse "1+"/"2+"/"3+"/"4+" (or a bare int) into a minimum bedroom count. */
export function parseBedroomsMin(raw: unknown): number | null {
  if (typeof raw === 'number' && Number.isFinite(raw)) return Math.trunc(raw)
  if (typeof raw !== 'string') return null
  const m = raw.match(/\d+/)
  return m ? parseInt(m[0], 10) : null
}

export function parseOnboardingBlob(
  blob: Record<string, unknown> | null | undefined,
): ParsedPreferenceProfile {
  const b = blob ?? {}

  const budget = parseBudgetBand(b.budget)

  const rawPriorities = Array.isArray(b.lifestylePriorities)
    ? (b.lifestylePriorities as unknown[])
    : []
  const lifestylePriorities: string[] = []
  for (const p of rawPriorities) {
    const v = pickEnum(p, LIFESTYLE)
    if (v && !lifestylePriorities.includes(v)) lifestylePriorities.push(v)
  }

  const rawHoods = Array.isArray(b.neighbourhoods)
    ? (b.neighbourhoods as unknown[])
    : []
  const neighbourhoods: string[] = []
  for (const h of rawHoods) {
    if (typeof h === 'string') {
      const trimmed = h.trim()
      if (trimmed && !neighbourhoods.includes(trimmed)) neighbourhoods.push(trimmed)
    }
  }

  return {
    goal: pickEnum(b.goal, GOALS),
    timeline: pickEnum(b.timeline, TIMELINES),
    homeType: pickEnum(b.homeType, HOME_TYPES),
    budgetMin: budget.min,
    budgetMax: budget.max,
    bedroomsMin: parseBedroomsMin(b.bedrooms),
    mortgage: pickEnum(b.mortgage, MORTGAGES),
    workingWithRealtor: pickEnum(b.workingWithRealtor, REALTOR),
    openToNearby: typeof b.openToNearby === 'boolean' ? b.openToNearby : null,
    lifestylePriorities,
    neighbourhoods,
  }
}
