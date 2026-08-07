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
//
// ⚠️ SECOND INVARIANT (N-02): provenance is not the only thing this chokepoint
// controls — VOLUME is. Anything returned here is a prop crossing a server→client
// boundary, so React serialises it into the RSC flight payload embedded in the
// HTML *and* the island refetches the same payload after hydration. Passing
// `localEssentials` through verbatim cost ~103 KB of HTML on kitsilano and ~143 KB
// on vancouver (554 / 745 `shopAndEat` POIs), doubled by the refetch — for cards
// that render six bucket counts and nine names. So `localEssentials` is REDUCED
// here, not forwarded: see `LocalEssentialsSummary` below. Same trap as the
// `medianPrice` fix on the index page — if you find yourself widening this type to
// "just pass the array through", that is the bug reappearing.
import { bucketShopAndEat, type ShopEatBucket } from '@/lib/poi'
import type { NeighbourhoodDetailResponse, PoiItem } from '@/types/neighbourhood-detail'

/** The only per-POI fields any Local Essentials row renders. */
export interface PoiExample {
  id: string
  name: string
  /** Metres from the neighbourhood centroid. */
  distanceM: number
}

/**
 * Exactly what the Local Essentials grid renders — counts and a handful of
 * example names — and nothing else. Kilobytes instead of hundreds of them.
 */
export interface LocalEssentialsSummary {
  schoolsCount: number
  /** ≤3 nearest schools. */
  schools: PoiExample[]
  healthcareCount: number
  /** ≤3 nearest facilities. */
  healthcare: PoiExample[]
  parksCount: number
  /** ≤2 *named* parks. Empty when every nearby park is an unnamed OSM polygon —
   *  the card then states the bare count (N-03). */
  parkNames: string[]
  shopAndEatCount: number
  /** Pre-bucketed category chips; the 554-POI array never leaves the server. */
  shopBuckets: ShopEatBucket[]
  transitCount: number
  transitBusCount: number
  /** ≤3 named stops: rail leads, then the nearest bus stop, sorted by distance. */
  transitRows: PoiExample[]
}

export type NonDdfNeighbourhoodDetail = Pick<
  NeighbourhoodDetailResponse,
  'neighbourhood' | 'livability' | 'localInfoTiles'
> & {
  localEssentials: LocalEssentialsSummary
}

// The API coerces a null OSM name to the literal string "Unnamed", which reads as
// a place name once it lands in prose ("including Unnamed and Unnamed") or in a
// list of stations. Such POIs still COUNT — they are real green space and real
// stops — they just cannot be named (N-03).
function isNamed(p: PoiItem): boolean {
  return Boolean(p?.name) && p.name !== 'Unnamed'
}

function toExample(p: PoiItem): PoiExample {
  return { id: p.id, name: p.name, distanceM: p.distanceM }
}

/** Defensive: upstream may omit a category entirely (see `hasServerRenderableContent`). */
function asList(list: PoiItem[] | undefined | null): PoiItem[] {
  return Array.isArray(list) ? list : []
}

export function toLocalEssentialsSummary(
  raw: Partial<NeighbourhoodDetailResponse['localEssentials']> | undefined | null,
): LocalEssentialsSummary {
  const e = raw ?? {}
  const schools = asList(e.schools)
  const healthcare = asList(e.healthcare)
  const parks = asList(e.parks)
  const shopAndEat = asList(e.shopAndEat)
  const transit = asList(e.transit)
  const transitBus = asList(e.transitBus)

  // Rail leads, then the nearest bus stop — same split as the PDP Transit tile,
  // so a bus-only area still names something concrete instead of reading empty.
  const transitRows = [
    ...transit.filter(isNamed).slice(0, 2),
    ...transitBus.filter(isNamed).slice(0, 1),
  ]
    .sort((a, b) => a.distanceM - b.distanceM)
    .map(toExample)

  return {
    schoolsCount: schools.length,
    schools: schools.slice(0, 3).map(toExample),
    healthcareCount: healthcare.length,
    healthcare: healthcare.slice(0, 3).map(toExample),
    parksCount: parks.length,
    parkNames: parks.filter(isNamed).slice(0, 2).map((p) => p.name),
    shopAndEatCount: shopAndEat.length,
    shopBuckets: bucketShopAndEat(shopAndEat),
    transitCount: transit.length,
    transitBusCount: transitBus.length,
    transitRows,
  }
}

export function toNonDdfDetail(detail: NeighbourhoodDetailResponse): NonDdfNeighbourhoodDetail {
  return {
    neighbourhood: detail.neighbourhood,
    livability: detail.livability,
    localEssentials: toLocalEssentialsSummary(detail.localEssentials),
    localInfoTiles: detail.localInfoTiles ?? { staticMapUrl: null, streetViewUrl: null },
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
 *
 * ⚠️ N-08: this runs against an UNVALIDATED upstream body, and it is the thing
 * standing between a malformed response and a 500 on the route it exists to
 * protect. It must never dereference a nested field it has not proven, and it
 * must return false — not throw — when the shape is wrong. It also doubles as the
 * shape gate for the server render: the two structural checks up front are the
 * fields `NeighbourhoodDetailSections` dereferences unconditionally, so a body
 * missing either takes the client path instead of throwing downstream.
 */
export function hasServerRenderableContent(detail: NeighbourhoodDetailResponse): boolean {
  if (!detail || typeof detail !== 'object') return false

  const neighbourhood = detail.neighbourhood
  const breakdown = detail.livability?.breakdown
  if (!neighbourhood || !breakdown) return false

  const e = (detail.localEssentials ?? {}) as Partial<
    NeighbourhoodDetailResponse['localEssentials']
  >
  const count = (list: unknown) => (Array.isArray(list) ? list.length : 0)
  const poiCount =
    count(e.schools) +
    count(e.healthcare) +
    count(e.parks) +
    count(e.shopAndEat) +
    count(e.transit) +
    count(e.transitBus)

  // A renamed/absent sub-score must read as "no signal", not throw or coerce a
  // string into a comparison that quietly passes.
  const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : 0)

  return (
    Boolean(neighbourhood.description?.trim()) ||
    poiCount > 0 ||
    num(breakdown.walkability) > 0 ||
    num(breakdown.amenities) > 0 ||
    num(breakdown.transit) > 0 ||
    num(detail.livability?.percentile) > 0
  )
}
