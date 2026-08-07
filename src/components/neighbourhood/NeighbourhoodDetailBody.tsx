// SEO-03 — server body for the neighbourhood detail page.
//
// Was a 'use client' component that fetched everything through TanStack Query, so
// a crawler without a JS engine saw an empty shell: no bio, no livability, no
// essentials. It is now an async Server Component that fetches the aggregate
// payload during the render and hands the NON-DDF slice to the section spine.
//
// The DDF-derived fields (marketSnapshot, liveListings, housingAge) and the
// per-user personalization are NOT passed down — they stay behind the client
// islands inside <NeighbourhoodDetailSections>, which keep their own query.
// See ./nonDdfDetail.ts for the provenance boundary and why it is a chokepoint
// rather than a type.
//
// Note on the road not taken: seeding `useNeighbourhoodDetail` with this payload
// as `initialData` would either publish the DDF fields into the HTML, or — with
// them stripped — look fresh to TanStack (staleTime 300s) and suppress the refetch
// that the live listings and market snapshot depend on. Splitting the render is
// what keeps both invariants: no DDF in the HTML, and live data still loads.
//
// This component is wrapped in <Suspense> by the page, so the await below streams
// rather than blocking the shell.
import { getNeighbourhoodDetail } from '@/lib/api/neighbourhoods'
import NeighbourhoodDetailSections from './NeighbourhoodDetailSections'
import NeighbourhoodDetailClientBody from './NeighbourhoodDetailClientBody'
import {
  hasServerRenderableContent,
  toNonDdfDetail,
  type NonDdfNeighbourhoodDetail,
} from './nonDdfDetail'
import type { NeighbourhoodDetailResponse } from '@/types/neighbourhood-detail'

interface Props {
  slug: string
  province?: string
}

export default async function NeighbourhoodDetailBody({ slug, province }: Props) {
  // Every call inside getNeighbourhoodDetail already degrades to a fallback rather
  // than throwing, but a malformed upstream body can still reject the JSON parse —
  // and an uncaught throw here would 500 the whole route. One API hiccup must not
  // take the page down.
  //
  // N-08: the guard and the projection run INSIDE the try, not after it. Both walk
  // nested fields of an unvalidated upstream body (`detail.localEssentials.schools`,
  // `detail.livability.breakdown`), so a body that keeps `neighbourhood` but drops
  // or renames `localEssentials` used to throw from the guard itself — 500ing the
  // exact route this try/catch was added to protect. The guard is now defensive on
  // its own (see nonDdfDetail.ts) and belt-and-braces wrapped here: any throw on
  // this path degrades to the client fallback rather than to an error page.
  let sections: NonDdfNeighbourhoodDetail | null = null
  try {
    const detail: NeighbourhoodDetailResponse = await getNeighbourhoodDetail(slug)
    if (hasServerRenderableContent(detail)) sections = toNonDdfDetail(detail)
  } catch {
    sections = null
  }

  // Nothing of ours came back (cold start / outage / malformed body). Hand the
  // render to the browser, which can retry — see NeighbourhoodDetailClientBody.
  // Note this is NOT the unknown-slug path any more: an unknown slug 404s in the
  // page before this component is ever rendered (N-01).
  if (!sections) {
    return <NeighbourhoodDetailClientBody slug={slug} province={province} />
  }

  return <NeighbourhoodDetailSections slug={slug} detail={sections} province={province} />
}
