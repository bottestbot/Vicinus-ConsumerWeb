// ─── Vicinus IQ Brief — shared types ───────────────────────────────────────

export type BriefHighlightKind =
  | 'price_drop'
  | 'new_listing'
  | 'status_change'
  | 'open_house'

/**
 * FROZEN API CONTRACT highlight (BRIEF-08). Every field is computed
 * deterministically in `buildBriefFacts()` — never parsed out of the model's
 * text. `href` routes by DDF ListingKey, never the local Prisma cuid.
 */
export interface BriefHighlight {
  id: string
  kind: BriefHighlightKind
  label: string
  subLabel: string | null
  href: string
  listingKey: string | null
}

/**
 * Internal facts object — the single source of truth. The LLM phrases these;
 * it never computes them. Carries a few extra fields the copy generator reads
 * but the wire contract does not expose.
 */
export interface BriefFacts {
  generatedAt: string
  since: string
  isEmpty: boolean
  /** Count of unread alerts since `since` (0 in the forward-looking variant). */
  alertCount: number
  /** Per-kind tallies over the window, for the prose ("2 price drops"). */
  counts: Record<BriefHighlightKind, number>
  /** Cap of 3, salience-ranked. The CTA chips AND the copy render from these. */
  highlights: BriefHighlight[]
  /** Newest alert id in the window — the cache key ingredient (BRIEF-07). */
  latestAlertId: string | null
  /** Neighbourhood names driving the forward-looking variant, if any. */
  focusNeighbourhoods: string[]
}

/** FROZEN API CONTRACT response shape for GET /users/me/brief. */
export interface BriefResponse {
  headline: string
  body: string
  highlights: BriefHighlight[]
  generatedAt: string
  isFallback: boolean
  isEmpty: boolean
}
