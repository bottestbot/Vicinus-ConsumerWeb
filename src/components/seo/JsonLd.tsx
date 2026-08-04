import { serializeJsonLd, type JsonLdNode } from '@/lib/schema'

/**
 * Renders structured data as a `<script type="application/ld+json">` — SEO-04.
 *
 * The only sanctioned way to put JSON-LD on a page. Build the node(s) with a
 * builder from `src/lib/schema.ts` and hand them over:
 *
 * ```tsx
 * <JsonLd schema={[buildOrganizationSchema(), buildWebSiteSchema()]} />
 * ```
 *
 * Several nodes collapse into a single `@graph` document, so a page emits one
 * script tag regardless of how many schemas it declares.
 *
 * A `null`/`undefined`/empty `schema` renders nothing. That is deliberate:
 * builders like `buildFaqSchema` and `buildBreadcrumbSchema` return `null` when
 * they have no items, so a page can render this unconditionally rather than
 * guarding at every call site — and an empty `FAQPage` never ships.
 *
 * Server-rendered by design (no `'use client'`): crawlers that do not execute
 * JavaScript — GPTBot, ClaudeBot, PerplexityBot — are the whole point, and they
 * only see what is in the HTML.
 *
 * Escaping is `serializeJsonLd`'s job; see its doc comment. A plain `<script>`
 * is correct here rather than `next/script`, which is built for loading and
 * executing JS — this is inert data.
 */
export default function JsonLd({
  schema,
  id,
}: {
  schema: JsonLdNode | JsonLdNode[] | null | undefined
  /** Optional DOM id, handy when a page emits more than one block. */
  id?: string
}) {
  if (!schema || (Array.isArray(schema) && schema.length === 0)) return null

  return (
    <script
      id={id}
      type="application/ld+json"
      // Escaped by serializeJsonLd — `<`, `>`, `&` and the U+2028/9 separators
      // are all rewritten to unicode escapes, so no API-sourced string can
      // close the script element or open a comment.
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(schema) }}
    />
  )
}
