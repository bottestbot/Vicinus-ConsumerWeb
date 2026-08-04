// Sitemap data source (SEO-01).
//
// Deliberately a standalone module rather than an addition to
// `src/lib/api/neighbourhoods.ts`: that file is the neighbourhood *page's*
// client and carries launch-city display filters, mock fallbacks and shape
// mappers that a sitemap must not inherit. The sitemap needs exactly one thing
// — the canonical set of neighbourhood slugs, straight from the DB via the API,
// never a hardcoded list (a hardcoded list drifts silently the moment a row is
// added).

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001'

/** Shape of `GET /neighbourhoods` as far as the sitemap cares about it.
 *
 *  `livabilityComputedAt` / `createdAt` are typed optional on purpose: the
 *  `Neighbourhood` model carries `livabilityComputedAt` (there is no
 *  `updatedAt` column on this model), but the API's `listAll()` `select` does
 *  **not** project either field today, so both arrive `undefined`. Backend
 *  changes are out of scope here, so `lastModified` is simply omitted rather
 *  than faked with `new Date()` — a made-up timestamp that changes on every
 *  build teaches crawlers to distrust `<lastmod>` entirely, which is worse than
 *  having none. If the field is ever added to the projection this file picks it
 *  up with no further change. */
interface ApiNeighbourhoodRow {
  slug?: string | null
  livabilityComputedAt?: string | null
  createdAt?: string | null
}

export interface SitemapNeighbourhood {
  slug: string
  /** Omitted when the API exposes no usable timestamp — see above. */
  lastModified?: Date
}

function parseDate(value: string | null | undefined): Date | undefined {
  if (!value) return undefined
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? undefined : d
}

/**
 * Every neighbourhood slug that has a live `/neighbourhoods/<slug>` page.
 *
 * Note this intentionally does **not** apply the `LAUNCH_CITIES` display filter
 * used by `getNeighbourhoods()` — that filter governs which cards the index
 * grid renders, not which URLs exist. Every seeded row resolves at
 * `/neighbourhoods/<slug>`, and the SEO plan specifies the full set.
 *
 * Degrades to `[]` on any API failure so a sitemap of static routes still
 * builds rather than the whole route 500ing.
 */
export async function getNeighbourhoodSitemapEntries(): Promise<SitemapNeighbourhood[]> {
  let rows: ApiNeighbourhoodRow[]
  try {
    const res = await fetch(`${API_BASE}/neighbourhoods`, {
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(10_000),
    })
    if (!res.ok) return []
    rows = (await res.json()) as ApiNeighbourhoodRow[]
  } catch {
    return []
  }

  if (!Array.isArray(rows)) return []

  const seen = new Set<string>()
  const entries: SitemapNeighbourhood[] = []
  for (const row of rows) {
    const slug = row?.slug?.trim()
    if (!slug || seen.has(slug)) continue
    seen.add(slug)

    // `livabilityComputedAt` first: it marks when the page's substantive
    // content (the scores) actually changed. `createdAt` is the weak fallback.
    const lastModified = parseDate(row.livabilityComputedAt) ?? parseDate(row.createdAt)
    entries.push(lastModified ? { slug, lastModified } : { slug })
  }

  return entries
}
