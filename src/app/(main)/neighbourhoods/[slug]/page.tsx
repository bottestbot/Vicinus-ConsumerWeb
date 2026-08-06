// FE-501 / NBHD-16 / NBHD-D10: Neighbourhood Detail Page
// Server shell — owns metadata + page chrome. SEO-03: the section spine (split
// hero → narrative → AI fit card → essentials → livability → info tiles → live
// listings) is now rendered by the *server* <NeighbourhoodDetailBody>, so the bio,
// livability sub-scores and OSM local essentials are present in the raw HTML for
// crawlers that execute no JavaScript. The DDF-derived sections keep their own
// client fetch inside that tree. The forest CTA banner closes the page.
// NOTE: params is a Promise<{ slug }> in Next.js 16 App Router — must be awaited.
import { Suspense, cache } from 'react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getNeighbourhood } from '@/lib/api/neighbourhoods'
import NeighbourhoodDetailBody from '@/components/neighbourhood/NeighbourhoodDetailBody'
import NeighbourhoodDetailSkeleton from '@/components/neighbourhood/NeighbourhoodDetailSkeleton'
import NeighbourhoodCTA from '@/components/neighbourhood/NeighbourhoodCTA'

interface PageProps {
  params: Promise<{ slug: string }>
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001'

/**
 * N-01 — does this slug name a real neighbourhood?
 *
 * `getNeighbourhood` cannot answer this: `apiFetch` collapses every failure mode
 * into one fallback, and `getNeighbourhood` then invents a Title-Cased name from
 * the slug itself. So /neighbourhoods/zzz-does-not-exist-9999 rendered HTTP 200
 * with an H1 of "Zzz Does Not Exist 9999", a "— Neighbourhood Guide" title tag,
 * and a fabricated "Schools access 75" from `gradeToScore(null)` on the compose
 * path — an unlimited supply of indexable URLs asserting scores for places that
 * do not exist.
 *
 * This asks the API directly so it can read the STATUS, which is the only thing
 * that separates the two failure modes:
 *
 *   • 404/410 → the slug genuinely is not ours. The API is explicit about this
 *     ({"message":"Neighbourhood \"…\" not found","statusCode":404}), on both
 *     /neighbourhoods/:slug and /neighbourhoods/:slug/detail.
 *   • anything else — 5xx, timeout, connection refused, malformed body → UNKNOWN,
 *     and we must fail OPEN. A real neighbourhood must never 404 because the API
 *     was cold or briefly down; sparse-but-real slugs (port-kells-surrey,
 *     east-richmond-richmond) answer 200 with thin data and keep their existing
 *     Suspense → server-guard → client-fallback path untouched.
 *
 * `cache()` dedupes this between generateMetadata and the page render.
 */
const neighbourhoodExists = cache(async (slug: string): Promise<boolean> => {
  try {
    const res = await fetch(`${API_BASE}/neighbourhoods/${encodeURIComponent(slug)}`, {
      next: { revalidate: 1800 },
      signal: AbortSignal.timeout(5000),
    })
    return res.status !== 404 && res.status !== 410
  } catch {
    return true // transient — never 404 a real neighbourhood on a network blip
  }
})

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  // The page notFound()s below, but generateMetadata runs independently — without
  // this it would still emit "Zzz Does Not Exist 9999 — Neighbourhood Guide" as
  // the title of the 404 response.
  if (!(await neighbourhoodExists(slug))) {
    return { title: 'Neighbourhood not found', robots: { index: false, follow: false } }
  }
  const neighbourhood = await getNeighbourhood(slug)
  const description =
    neighbourhood.bio?.slice(0, 155) ??
    `Explore livability, market trends, and live listings in ${neighbourhood.name}, ${neighbourhood.city}.`
  return {
    title: `${neighbourhood.name} — Neighbourhood Guide`,
    description,
  }
}

export default async function NeighbourhoodDetailPage({ params }: PageProps) {
  const { slug } = await params
  // N-01: 404 before rendering anything. Must stay ahead of the Suspense boundary
  // below — once the shell has flushed, the response status is already committed.
  if (!(await neighbourhoodExists(slug))) notFound()
  const neighbourhood = await getNeighbourhood(slug)

  return (
    <div className="min-h-screen bg-[#FAF9F6] pb-16 pt-16 font-ui">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* The aggregate /detail call is the slow one on this route, and the API
            has a known cold-start. Streaming it behind Suspense means a slow
            upstream costs a skeleton, not a blank page — the shell and the CTA
            flush immediately. */}
        <Suspense fallback={<NeighbourhoodDetailSkeleton />}>
          <NeighbourhoodDetailBody slug={slug} province={neighbourhood.province} />
        </Suspense>
        <NeighbourhoodCTA
          name={neighbourhood.name}
          slug={slug}
          lat={neighbourhood.lat}
          lng={neighbourhood.lng}
        />
      </div>
    </div>
  )
}
