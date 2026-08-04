// SEO-01 — sitemap.xml.
//
// ⚠️ Build it, do not submit it. The SEO plan (docs/seo-implementation-plan.md,
// "Sequencing trap") gates Search Console submission on Phase 3, after the
// neighbourhood pages actually server-render their content. A 41-URL sitemap
// discovered while those pages are still empty shells spends our one good
// first-crawl impression on thin pages.
//
// ⚠️ No property/listing URLs. Vicinus is a Real Estate Advertising Website on
// the CREA DDF National Shared Pool and CREA has historically restricted
// search-engine indexing of DDF listing detail. SEO-05 is the written
// compliance decision that unblocks it; until then `/properties/*` stays out of
// this file. This is a hard constraint, not an oversight.
import type { MetadataRoute } from 'next'
import { getNeighbourhoodSitemapEntries } from '@/lib/api/sitemap-data'

// Same convention as `metadataBase` in src/app/layout.tsx.
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://vicinus.ca'

// Refresh hourly so a newly seeded neighbourhood appears without a redeploy.
export const revalidate = 3600

type SitemapEntry = MetadataRoute.Sitemap[number]

/** Public, indexable routes, verified against the route tree in `src/app/`.
 *
 *  Deliberately excluded:
 *  - `/search`   — 308 permanent redirect to `/buy` / `/rent`; a sitemap should
 *                  list destinations, not redirects.
 *  - `/vibe/[shortId]` — per-user quiz results, not evergreen content.
 *  - `/feed`, `/dashboard`, `/onboarding`, `/sign-in`, `/sign-up` — private or
 *                  thin; also disallowed in robots.ts.
 *  - `/properties/[id]` — gated on SEO-05 (see header). */
const STATIC_ROUTES: Array<{
  path: string
  changeFrequency: SitemapEntry['changeFrequency']
  priority: number
}> = [
  { path: '/', changeFrequency: 'daily', priority: 1 },
  { path: '/neighbourhoods', changeFrequency: 'weekly', priority: 0.9 },
  { path: '/buy', changeFrequency: 'daily', priority: 0.9 },
  { path: '/rent', changeFrequency: 'daily', priority: 0.8 },
  { path: '/sell', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/vibe', changeFrequency: 'monthly', priority: 0.6 },
  { path: '/realtor-hub', changeFrequency: 'monthly', priority: 0.5 },
  { path: '/privacy', changeFrequency: 'yearly', priority: 0.2 },
  { path: '/terms', changeFrequency: 'yearly', priority: 0.2 },
]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const neighbourhoods = await getNeighbourhoodSitemapEntries()

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((route) => ({
    url: `${BASE_URL}${route.path === '/' ? '' : route.path}`,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }))

  // `lastModified` is only emitted when the API actually gave us a timestamp —
  // see the note in sitemap-data.ts. Never synthesise one.
  const neighbourhoodEntries: MetadataRoute.Sitemap = neighbourhoods.map((n) => ({
    url: `${BASE_URL}/neighbourhoods/${n.slug}`,
    ...(n.lastModified ? { lastModified: n.lastModified } : {}),
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }))

  return [...staticEntries, ...neighbourhoodEntries]
}
