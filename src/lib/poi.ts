// POI selection helpers for the PDP neighbourhood section ("Life around
// {address}"). The API's PoiItem.distanceM is measured from the neighbourhood
// centroid; the property page wants distances from the listing itself, so we
// recompute from the POI coordinates when they exist and fall back to the
// centroid figure (flagged approx) for legacy composed payloads that ship
// lat/lng as 0.
import type { PoiItem } from '@/types/neighbourhood-detail'
import { haversineDistanceM } from '@/lib/geo'

export interface HomeRelativePoi extends PoiItem {
  /** Metres from the listing (falls back to centroid distance when approx). */
  homeDistanceM: number
  /** True when POI or home coords were missing and we used the centroid figure. */
  approx: boolean
}

function validCoords(lat: number, lng: number): boolean {
  return Number.isFinite(lat) && Number.isFinite(lng) && !(lat === 0 && lng === 0)
}

export function withHomeDistance(
  pois: PoiItem[],
  homeLat: number,
  homeLng: number,
): HomeRelativePoi[] {
  const homeOk = validCoords(homeLat, homeLng)
  return pois.map((p) =>
    homeOk && validCoords(p.lat, p.lng)
      ? { ...p, homeDistanceM: haversineDistanceM(homeLat, homeLng, p.lat, p.lng), approx: false }
      : { ...p, homeDistanceM: p.distanceM, approx: true },
  )
}

export interface NearestSelection {
  nearest: HomeRelativePoi[]
  /** How many POIs in the category beyond the ones shown ("+ N more"). */
  moreCount: number
}

/** Nearest `count` POIs by distance from the home. Approx entries with no
 *  usable distance at all (0 from the legacy "—" parse) sort last rather than
 *  first — an unknown distance must never win "nearest". */
export function nearestPois(
  pois: PoiItem[],
  homeLat: number,
  homeLng: number,
  count: number,
): NearestSelection {
  const rank = (p: HomeRelativePoi) =>
    p.approx && p.homeDistanceM <= 0 ? Number.POSITIVE_INFINITY : p.homeDistanceM
  const ranked = withHomeDistance(pois, homeLat, homeLng).sort((a, b) => rank(a) - rank(b))
  return {
    nearest: ranked.slice(0, Math.max(0, count)),
    moreCount: Math.max(0, ranked.length - count),
  }
}

// ─── Shop & eat bucketing ─────────────────────────────────────────────────────
// Shared with the neighbourhood page's Local Essentials card so both surfaces
// bucket identically.

export interface ShopEatBucket {
  key: 'restaurants' | 'cafes' | 'grocers' | 'shops' | 'places'
  count: number
  /** Count-aware label, e.g. "restaurants" / "restaurant". */
  label: string
}

const BUCKET_LABELS: Record<ShopEatBucket['key'], [singular: string, plural: string]> = {
  restaurants: ['restaurant', 'restaurants'],
  cafes: ['café', 'cafés'],
  grocers: ['grocer', 'grocers'],
  shops: ['shop', 'shops'],
  places: ['place', 'places'],
}

// Display order when counts tie.
const BUCKET_ORDER: ShopEatBucket['key'][] = ['restaurants', 'cafes', 'grocers', 'shops', 'places']

function bucketKey(category: string): ShopEatBucket['key'] {
  const c = category.toLowerCase()
  if (/(restaurant|food|dining)/.test(c)) return 'restaurants'
  if (/(cafe|coffee)/.test(c)) return 'cafes'
  if (/(grocer|supermarket|market)/.test(c)) return 'grocers'
  // The ingestion files generic shop=* POIs under "errands".
  if (/(shop|store|retail|errand)/.test(c)) return 'shops'
  return 'places'
}

export function bucketShopAndEat(items: Array<Pick<PoiItem, 'category'>>): ShopEatBucket[] {
  const counts = new Map<ShopEatBucket['key'], number>()
  for (const item of items) {
    const key = bucketKey(item.category)
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  return [...counts.entries()]
    .map(([key, count]) => ({
      key,
      count,
      label: count === 1 ? BUCKET_LABELS[key][0] : BUCKET_LABELS[key][1],
    }))
    .sort(
      (a, b) => b.count - a.count || BUCKET_ORDER.indexOf(a.key) - BUCKET_ORDER.indexOf(b.key),
    )
}
