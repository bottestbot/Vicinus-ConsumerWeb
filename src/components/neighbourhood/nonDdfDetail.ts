// SEO-03 — the data-provenance boundary for the neighbourhood detail page.
//
// `NeighbourhoodDetailResponse` mixes two very different kinds of data:
//
//   ours / open data (safe to server-render)  |  CREA/DDF-derived (must not be)
//   ------------------------------------------|--------------------------------
//   neighbourhood (name, bio, photo, boundary) |  marketSnapshot
//   livability (composite, percentile, bars)   |  liveListings
//   localEssentials (OSM POIs)                 |  housingAge (build years OF the
//   localInfoTiles (static map / street view)  |    active listings, not the stock)
//                                              |  personalization (per-user)
//
// Indexing of DDF-derived content is gated on the SEO-05 compliance decision, and
// `personalization` must never be indexed regardless. So only the left column is
// allowed to cross into server-rendered HTML; the right column stays behind client
// components that keep their own fetch (see the *Island components in this folder).
//
// `toNonDdfDetail` is the single chokepoint. It builds a fresh object literal with
// exactly the allowed keys, so nothing on the right can ride along by accident —
// structural typing alone would happily let the full payload through.
import type { NeighbourhoodDetailResponse } from '@/types/neighbourhood-detail'

export type NonDdfNeighbourhoodDetail = Pick<
  NeighbourhoodDetailResponse,
  'neighbourhood' | 'livability' | 'localEssentials' | 'localInfoTiles'
>

export function toNonDdfDetail(detail: NeighbourhoodDetailResponse): NonDdfNeighbourhoodDetail {
  return {
    neighbourhood: detail.neighbourhood,
    livability: detail.livability,
    localEssentials: detail.localEssentials,
    localInfoTiles: detail.localInfoTiles,
  }
}

/**
 * True when the payload carries enough of our own content to be worth putting in
 * the HTML. Every upstream call in `getNeighbourhoodDetail` degrades to a fallback
 * rather than throwing, so an API outage or cold start yields a *shaped but empty*
 * payload — name derived from the slug, no bio, no POIs. Rendering that
 * server-side would publish "No schools found nearby yet" as fact and bake an
 * all-zero livability panel into the page.
 *
 * When this returns false the page falls back to client-side fetching, which is
 * exactly today's behaviour: the visitor gets skeletons and a retry that can
 * succeed once the API is warm, instead of a confidently wrong page.
 *
 * ⚠️ `livability.score` and `breakdown.schools` are NOT valid signals. On the
 * composed fallback path `gradeToScore(null)` returns 75, so a completely empty
 * payload still yields a schools sub-score of 75 and a composite around 23 — both
 * entirely fabricated. Only fields that stay falsy on an empty payload count.
 */
export function hasServerRenderableContent(detail: NeighbourhoodDetailResponse): boolean {
  const e = detail.localEssentials
  const poiCount =
    e.schools.length +
    e.healthcare.length +
    e.parks.length +
    e.shopAndEat.length +
    (e.transit?.length ?? 0) +
    (e.transitBus?.length ?? 0)

  const { walkability, amenities, transit } = detail.livability.breakdown

  return (
    Boolean(detail.neighbourhood.description?.trim()) ||
    poiCount > 0 ||
    walkability > 0 ||
    amenities > 0 ||
    (transit ?? 0) > 0 ||
    detail.livability.percentile > 0
  )
}
