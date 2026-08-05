// Sitemap data source (SEO-01).
//
// A standalone module rather than an addition to `src/lib/api/neighbourhoods.ts`
// so this file and the neighbourhood-page work stay on disjoint files (see the
// track table in docs/seo-implementation-plan.md). It needs exactly one thing —
// the set of neighbourhood slugs that should be indexed, read live from the API,
// never a hardcoded list (a hardcoded list drifts silently the moment a row is
// seeded).
//
// It does share one rule with the page client: `isLaunchCity`. See
// `getNeighbourhoodSitemapEntries` below for why the sitemap honours it.

import { isLaunchCity } from '@/lib/api/neighbourhoods'

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
  /** Needed only to drop bare-municipality rows — see `name === city` below. */
  name?: string | null
  city?: string | null
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
 * The neighbourhood slugs that belong in the sitemap.
 *
 * ⚠️ Filtered by `isLaunchCity`, deliberately — this is not an oversight, and
 * the `/neighbourhoods/<slug>` route resolves for the excluded rows too.
 *
 * The rows outside `LAUNCH_CITIES` sit on unverified centroids, so their
 * livability scores render collapsed or simply wrong (see the comment on
 * `LAUNCH_CITIES` in `neighbourhoods.ts`). Submitting them would put known-bad
 * scores in front of Google while we publish methodology pages claiming
 * scoring rigor — and it would contradict the index grid, which renders only
 * launch cities, leaving the rest as sitemap-only orphans with no crawl path.
 * The risk is asymmetric: badly-indexed pages take weeks to clear, whereas
 * widening coverage later costs nothing.
 *
 * So: **widening `LAUNCH_CITIES` automatically widens the sitemap.** Once a
 * city's centroids are verified, add it there and this file follows — there is
 * nothing to change here. Do not "fix" this by dropping the filter.
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
    if (!isLaunchCity(row.city)) continue

    // Drop bare-municipality rows (`name === city`, e.g. "Vancouver" in
    // Vancouver). They exist so cities are searchable, not as places to browse
    // into, and `browsableNeighbourhoods()` excludes them from the index grid.
    // Without this the sitemap volunteered 10 URLs nothing on the site links
    // to — orphans with no crawl path, which is the exact problem the
    // launch-city filter above exists to avoid. Mirrors that helper's rule;
    // kept as a local check because this module only fetches the two fields it
    // needs rather than the full `Neighbourhood` shape.
    const name = row?.name?.trim()
    if (name && row.city && name.toLowerCase() === row.city.trim().toLowerCase()) continue

    seen.add(slug)

    // `livabilityComputedAt` first: it marks when the page's substantive
    // content (the scores) actually changed. `createdAt` is the weak fallback.
    const lastModified = parseDate(row.livabilityComputedAt) ?? parseDate(row.createdAt)
    entries.push(lastModified ? { slug, lastModified } : { slug })
  }

  return entries
}
