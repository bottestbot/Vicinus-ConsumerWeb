/**
 * Structured data (JSON-LD) builders — SEO-04.
 *
 * Single source of truth for every schema.org node the site emits. Pages import
 * a builder, pass it to `<JsonLd>` (src/components/seo/JsonLd.tsx), and never
 * hand-roll a `<script type="application/ld+json">` themselves.
 *
 * Rules this file keeps:
 *  - **Pure.** Builders take plain data in and return a plain object out. No
 *    fetching, no `process`-dependent branching beyond the base URL, no React.
 *    That makes them callable from server components, route handlers and tests
 *    alike, and keeps them trivially unit-testable.
 *  - **No `@context` on nodes.** Builders return bare nodes; `serializeJsonLd`
 *    adds `@context` once, and merges multiple nodes into an `@graph`. This is
 *    what lets a page emit several schemas in one script tag without repeating
 *    the context or risking two conflicting ones.
 *  - **`@id` everywhere it is stable.** Nodes cross-reference by `@id`
 *    (`publisher`, `author`, `isPartOf`), so consumers stitch the page's
 *    entities into one graph instead of seeing duplicated organizations.
 *  - **Empty values are pruned**, so an optional field that happens to be null
 *    never ships as `"description": null` (which validators flag).
 *
 * ⚠️ **No `RealEstateListing` / `Residence` builders live here, deliberately.**
 * Listing-level structured data is gated on SEO-05 — the CREA/DDF compliance
 * decision about whether DDF listing detail may be indexed at all. Do not add
 * them until that decision is written down.
 */

import { STRINGS } from '@/lib/strings'

// ─── Base URL ────────────────────────────────────────────────────────────────
// Same convention as `metadataBase` in src/app/layout.tsx — keep the two in
// sync, or canonical URLs and JSON-LD `url`s will disagree.

/** Site origin, no trailing slash. Mirrors `metadataBase`. */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://vicinus.ca').replace(/\/+$/, '')

/** Stable node ids. Referenced from other schemas so the page reads as one graph. */
export const ORGANIZATION_ID = `${SITE_URL}/#organization`
export const WEBSITE_ID = `${SITE_URL}/#website`

const SCHEMA_CONTEXT = 'https://schema.org'

/**
 * U+2028 / U+2029. Legal inside a JSON string, but they terminate a line in
 * some parsers, so `serializeJsonLd` escapes them. Built from char codes so
 * this source file stays pure ASCII — a literal separator here would be an
 * invisible landmine in the regex.
 */
const LINE_SEPARATORS = new RegExp(`[${String.fromCharCode(0x2028, 0x2029)}]`, 'g')

/** Canada-wide, English content. Used on `WebSite` and article nodes. */
const IN_LANGUAGE = 'en-CA'

/**
 * Absolute URL for a site path. Accepts an already-absolute URL and returns it
 * untouched, so callers can pass either `/neighbourhoods/kitsilano` or a full
 * URL without branching.
 */
export function absoluteUrl(pathOrUrl: string): string {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl
  return `${SITE_URL}${pathOrUrl.startsWith('/') ? '' : '/'}${pathOrUrl}`
}

// ─── Types ───────────────────────────────────────────────────────────────────

export type JsonLdValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | JsonLdValue[]
  | { [key: string]: JsonLdValue }

/** A bare schema.org node — no `@context` (see the file header). */
export interface JsonLdNode {
  '@type': string | string[]
  '@id'?: string
  [key: string]: JsonLdValue | undefined
}

export interface OrganizationSchema extends JsonLdNode {
  '@type': 'Organization'
}
export interface WebSiteSchema extends JsonLdNode {
  '@type': 'WebSite'
}
export interface BreadcrumbListSchema extends JsonLdNode {
  '@type': 'BreadcrumbList'
}
export interface PlaceSchema extends JsonLdNode {
  '@type': 'Place'
}
export interface AggregateRatingSchema extends JsonLdNode {
  '@type': 'AggregateRating'
}
export interface TechArticleSchema extends JsonLdNode {
  '@type': 'TechArticle'
}
export interface FaqPageSchema extends JsonLdNode {
  '@type': 'FAQPage'
}

// ─── Organization ────────────────────────────────────────────────────────────

export interface OrganizationInput {
  name?: string
  /** Absolute or site-relative. Defaults to the site root. */
  url?: string
  /** Absolute or site-relative logo URL. */
  logo?: string
  description?: string
  slogan?: string
  /** Verified profile URLs (social, Crunchbase, Wikidata…). Omitted when empty. */
  sameAs?: string[]
  email?: string
  telephone?: string
}

/**
 * The publisher node, emitted once in the root layout.
 *
 * Typed as `Organization`, **not** `RealEstateAgent` / `RealEstateBusiness`:
 * Vicinus operates as a Real Estate Advertising Website over the DDF National
 * Shared Pool, not as a brokerage. Claiming an agent type would misdescribe the
 * business and sits badly against the CREA attribution rules.
 */
export function buildOrganizationSchema(input: OrganizationInput = {}): OrganizationSchema {
  return {
    '@type': 'Organization',
    '@id': ORGANIZATION_ID,
    name: input.name ?? STRINGS.SCHEMA_ORGANIZATION_NAME,
    url: absoluteUrl(input.url ?? '/'),
    logo: {
      '@type': 'ImageObject',
      url: absoluteUrl(input.logo ?? '/icon.svg'),
    },
    image: absoluteUrl('/opengraph-image'),
    description: input.description ?? STRINGS.SCHEMA_ORGANIZATION_DESCRIPTION,
    slogan: input.slogan ?? STRINGS.SCHEMA_ORGANIZATION_SLOGAN,
    areaServed: { '@type': 'Country', name: 'Canada' },
    email: input.email,
    telephone: input.telephone,
    sameAs: input.sameAs,
  }
}

// ─── WebSite ─────────────────────────────────────────────────────────────────

export interface WebSiteInput {
  name?: string
  url?: string
  description?: string
  /**
   * Sitelinks-searchbox target. `{search_term_string}` is substituted by the
   * consumer. Defaults to `/buy?q=…` — `/search` is a 308 to `/buy`, and
   * pointing a declared action at a redirect is a needless hop.
   */
  searchUrlTemplate?: string
}

export function buildWebSiteSchema(input: WebSiteInput = {}): WebSiteSchema {
  return {
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    name: input.name ?? STRINGS.SCHEMA_WEBSITE_NAME,
    url: absoluteUrl(input.url ?? '/'),
    description: input.description ?? STRINGS.SCHEMA_WEBSITE_DESCRIPTION,
    inLanguage: IN_LANGUAGE,
    publisher: { '@id': ORGANIZATION_ID },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate:
          input.searchUrlTemplate ?? `${SITE_URL}/buy?q={search_term_string}`,
      },
      // schema.org's own spelling — the hyphen is required, not a typo.
      'query-input': 'required name=search_term_string',
    },
  }
}

// ─── BreadcrumbList ──────────────────────────────────────────────────────────

export interface BreadcrumbItem {
  name: string
  /** Site-relative path or absolute URL for this crumb. */
  url: string
}

/**
 * Returns `null` for an empty trail — an itemless `BreadcrumbList` is invalid
 * markup, so callers can render `<JsonLd schema={…}>` unconditionally and let
 * it no-op.
 */
export function buildBreadcrumbSchema(items: BreadcrumbItem[]): BreadcrumbListSchema | null {
  if (items.length === 0) return null
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.url),
    })),
  }
}

// ─── AggregateRating ─────────────────────────────────────────────────────────

export interface AggregateRatingInput {
  /**
   * The livability composite, on its native **0–100** scale — pass it as-is,
   * do not rescale to 5. `bestRating`/`worstRating` below declare the scale so
   * consumers interpret 78 as 78/100 rather than 78/5.
   */
  ratingValue: number
  /**
   * How many underlying observations the score is computed from (POIs, stops,
   * schools…). Required: Google drops an `AggregateRating` with no count.
   *
   * ⚠️ This is an **algorithmic** score, not user reviews. Google's review-
   * snippet guidance is written for user-generated ratings, so treat a rich
   * result here as a bonus, not the goal — the real payoff is machine-readable
   * facts for AI answer engines. Never fabricate a count to make it render.
   */
  ratingCount: number
  /** Defaults to 100 / 0 — the livability scale. */
  bestRating?: number
  worstRating?: number
  /** e.g. "Vicinus Livability Score" — labels what was actually measured. */
  name?: string
}

export function buildAggregateRatingSchema(input: AggregateRatingInput): AggregateRatingSchema {
  return {
    '@type': 'AggregateRating',
    name: input.name,
    ratingValue: Math.round(input.ratingValue * 10) / 10,
    bestRating: input.bestRating ?? 100,
    worstRating: input.worstRating ?? 0,
    ratingCount: input.ratingCount,
  }
}

// ─── Place ───────────────────────────────────────────────────────────────────

export interface PlaceInput {
  name: string
  /** Canonical page URL for this place (site-relative or absolute). */
  url: string
  description?: string | null
  /** Hero image, absolute or site-relative. */
  image?: string | null
  latitude?: number | null
  longitude?: number | null
  city?: string | null
  /** Province/territory name or code, e.g. "British Columbia". */
  province?: string | null
  country?: string
  /** Already-built rating node, or the raw input to build one from. */
  aggregateRating?: AggregateRatingSchema | AggregateRatingInput | null
  /**
   * Sub-scores and other measured facts as `PropertyValue`s — this is the part
   * AI answer engines actually extract, so prefer naming the metric precisely
   * ("Walkability score", "Transit score") over generic labels.
   */
  additionalProperty?: { name: string; value: number | string; unitText?: string }[]
}

/**
 * `Place` for a neighbourhood page.
 *
 * `containedInPlace` nests City → State → Country so a consumer can resolve
 * "Kitsilano" to the right Kitsilano.
 */
export function buildPlaceSchema(input: PlaceInput): PlaceSchema {
  const url = absoluteUrl(input.url)

  const geo =
    input.latitude != null && input.longitude != null
      ? { '@type': 'GeoCoordinates', latitude: input.latitude, longitude: input.longitude }
      : undefined

  const country = { '@type': 'Country', name: input.country ?? 'Canada' }
  const state = input.province
    ? { '@type': 'State', name: input.province, containedInPlace: country }
    : undefined
  const containedInPlace = input.city
    ? { '@type': 'City', name: input.city, containedInPlace: state ?? country }
    : (state ?? country)

  const rating =
    input.aggregateRating == null
      ? undefined
      : '@type' in input.aggregateRating
        ? input.aggregateRating
        : buildAggregateRatingSchema(input.aggregateRating)

  return {
    '@type': 'Place',
    '@id': `${url}#place`,
    name: input.name,
    url,
    description: input.description,
    image: input.image ? absoluteUrl(input.image) : undefined,
    geo,
    containedInPlace,
    aggregateRating: rating,
    additionalProperty: input.additionalProperty?.map((p) => ({
      '@type': 'PropertyValue',
      name: p.name,
      value: p.value,
      unitText: p.unitText,
    })),
  }
}

// ─── TechArticle ─────────────────────────────────────────────────────────────

export interface TechArticleInput {
  headline: string
  description: string
  /** Canonical URL of the article page (site-relative or absolute). */
  url: string
  /** ISO 8601. Omit rather than guess — a wrong date is worse than none. */
  datePublished?: string
  dateModified?: string
  image?: string
  /** e.g. "Methodology". */
  articleSection?: string
  keywords?: string[]
  /** schema.org TechArticle-specific: 'Beginner' | 'Expert'. */
  proficiencyLevel?: 'Beginner' | 'Expert'
  /** What a reader needs to know/have to follow along. */
  dependencies?: string
}

/**
 * `TechArticle` for the published methodology pages (SEO-08). Author and
 * publisher are self-describing rather than bare `@id` references so the node
 * validates standalone, while still merging with the layout's Organization.
 */
export function buildTechArticleSchema(input: TechArticleInput): TechArticleSchema {
  const url = absoluteUrl(input.url)
  const publisher = {
    '@type': 'Organization',
    '@id': ORGANIZATION_ID,
    name: STRINGS.SCHEMA_ORGANIZATION_NAME,
    url: SITE_URL,
  }

  return {
    '@type': 'TechArticle',
    '@id': `${url}#article`,
    headline: input.headline,
    description: input.description,
    url,
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    inLanguage: IN_LANGUAGE,
    isAccessibleForFree: true,
    datePublished: input.datePublished,
    dateModified: input.dateModified ?? input.datePublished,
    image: input.image ? absoluteUrl(input.image) : undefined,
    articleSection: input.articleSection,
    keywords: input.keywords,
    proficiencyLevel: input.proficiencyLevel,
    dependencies: input.dependencies,
    author: publisher,
    publisher,
    isPartOf: { '@id': WEBSITE_ID },
  }
}

// ─── FAQPage ─────────────────────────────────────────────────────────────────

export interface FaqItem {
  question: string
  /** Plain text or a small amount of inline HTML — both are valid `Answer.text`. */
  answer: string
}

/**
 * Returns `null` when there are no questions, for the same reason
 * `buildBreadcrumbSchema` does.
 *
 * ⚠️ Every Q&A here **must** also be visible on the page. Google treats
 * FAQ markup that has no on-page counterpart as a structured-data violation,
 * and it is the single easiest way to earn a manual action.
 */
export function buildFaqSchema(items: FaqItem[], options: { url?: string } = {}): FaqPageSchema | null {
  if (items.length === 0) return null
  const url = options.url ? absoluteUrl(options.url) : undefined
  return {
    '@type': 'FAQPage',
    '@id': url ? `${url}#faq` : undefined,
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
  }
}

// ─── Serialization ───────────────────────────────────────────────────────────

/**
 * Drop `undefined`/`null`, empty strings, empty arrays and empty objects,
 * recursively. `0` and `false` are meaningful values and survive.
 */
function prune(value: JsonLdValue): JsonLdValue | undefined {
  if (value === null || value === undefined) return undefined
  if (typeof value === 'string') return value.length > 0 ? value : undefined
  if (typeof value !== 'object') return value

  if (Array.isArray(value)) {
    const items = value.map(prune).filter((v): v is JsonLdValue => v !== undefined)
    return items.length > 0 ? items : undefined
  }

  const out: Record<string, JsonLdValue> = {}
  for (const [key, raw] of Object.entries(value)) {
    const pruned = prune(raw)
    if (pruned !== undefined) out[key] = pruned
  }
  return Object.keys(out).length > 0 ? out : undefined
}

/**
 * Serialize node(s) into the exact string that goes inside
 * `<script type="application/ld+json">`.
 *
 * One node ships as a plain document; several ship under `@graph`, so a page
 * needs only one script tag no matter how many schemas it emits.
 *
 * **Escaping.** `JSON.stringify` does not sanitize for HTML injection: a `<`
 * inside any string value could close the script element early (`</script>`)
 * or open a comment (`<!--`), which is an XSS vector on any field sourced from
 * the API. Per the Next.js JSON-LD guide, `<` is rewritten to its unicode
 * escape; `>` and `&` go too (belt and braces — both are valid JSON escapes and
 * decode back to the original characters), as do the U+2028/U+2029 line
 * separators that break some parsers.
 */
export function serializeJsonLd(schema: JsonLdNode | JsonLdNode[]): string {
  const nodes = (Array.isArray(schema) ? schema : [schema]).filter(Boolean)
  const document =
    nodes.length === 1
      ? { '@context': SCHEMA_CONTEXT, ...nodes[0] }
      : { '@context': SCHEMA_CONTEXT, '@graph': nodes }

  return JSON.stringify(prune(document) ?? {})
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(LINE_SEPARATORS, (c) => (c.charCodeAt(0) === 0x2028 ? '\\u2028' : '\\u2029'))
}
