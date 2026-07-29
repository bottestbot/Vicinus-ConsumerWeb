// "Life around {address}" — the PDP neighbourhood section, Merge 3 design
// (docs/designs/mockups/pdp-neighbourhood-merged-cd.html): evidence on the
// left (static map + essentials tiles with distances from THIS home), verdict
// rail on the right. Replaces the old walk/lifestyle score cards, which
// rendered hardcoded fallbacks (80 / 8 / "Very Walkable") for most listings.
//
// Server component: all data arrives resolved from the page; the only client
// boundary is the rail (personalization fetch). Degrades honestly — a listing
// outside any known neighbourhood gets a map and nothing invented.
import Link from 'next/link'
import { TreePine, GraduationCap, ShoppingBag, TrainFront } from 'lucide-react'
import type { PropertyDetail } from '@/types/property'
import type { NeighbourhoodDetailResponse } from '@/types/neighbourhood-detail'
import { formatDistance } from '@/lib/format'
import { bucketShopAndEat, nearestPois, withHomeDistance, type HomeRelativePoi } from '@/lib/poi'
import NeighbourhoodMiniMap, { type MiniMapPoi, type MiniMapPoiKind } from './NeighbourhoodMiniMap'
import VerdictRail, { type RailReason } from './VerdictRail'

interface NeighbourhoodContextScoreProps {
  property: PropertyDetail
  /** Resolved neighbourhood aggregate; null when the listing sits outside any
   *  known neighbourhood (section degrades — never fabricates scores). */
  detail: NeighbourhoodDetailResponse | null
}

// 15-minute walk at a brisk-ish 80 m/min.
const WALK_15_MIN_M = 1_200

function poiDistanceLabel(p: HomeRelativePoi): string | null {
  if (p.approx && p.homeDistanceM <= 0) return null
  return `${p.approx ? '~' : ''}${formatDistance(p.homeDistanceM)}`
}

interface TileData {
  key: string
  title: string
  icon: React.ReactNode
  mapKind: MiniMapPoiKind
  primary: HomeRelativePoi | null
  secondary: string | null
  chips: string[]
}

function buildTiles(
  detail: NeighbourhoodDetailResponse,
  homeLat: number,
  homeLng: number,
): TileData[] {
  const { parks, schools, shopAndEat, transit = [], transitBus = [] } = detail.localEssentials

  const parksSel = nearestPois(parks, homeLat, homeLng, 1)
  const parksWithin15 = withHomeDistance(parks, homeLat, homeLng).filter(
    (p) => !p.approx && p.homeDistanceM <= WALK_15_MIN_M,
  ).length
  const schoolsSel = nearestPois(schools, homeLat, homeLng, 1)
  const stationSel = nearestPois(transit, homeLat, homeLng, 1)
  const busSel = nearestPois(transitBus, homeLat, homeLng, 1)
  const shopBuckets = bucketShopAndEat(shopAndEat).slice(0, 3)

  const moreLine = (n: number) => (n > 0 ? `+ ${n} more nearby` : null)

  // Transit ALWAYS leads the grid (product decision — never Healthcare here).
  // Stations/stops when ingested; else the GTFS-based sub-score; else an honest
  // "no data yet" line. Healthcare data still exists in the API for other
  // surfaces, it just doesn't get a PDP tile.
  //
  // A rail station headlines when there is one — it's the stronger signal, and
  // it's what buyers ask about — with the nearest bus stop on the second line.
  // Most areas have no station at all, so the bus stop leads there instead.
  const nearestStation = stationSel.nearest[0] ?? null
  const nearestBus = busSel.nearest[0] ?? null
  const transitPrimary = nearestStation ?? nearestBus
  const busStopLine = (p: HomeRelativePoi) => {
    const dist = poiDistanceLabel(p)
    return `Bus stop — ${p.name}${dist ? ` · ${dist}` : ''}`
  }
  const transitScore = detail.livability.breakdown.transit
  const transitTile: TileData = transitPrimary
    ? {
        key: 'transit',
        title: 'Transit',
        icon: <TrainFront size={13} />,
        mapKind: 'transit',
        primary: transitPrimary,
        secondary: nearestStation && nearestBus ? busStopLine(nearestBus) : null,
        chips: [],
      }
    : transitScore != null && transitScore > 0
      ? {
          key: 'transit',
          title: 'Transit',
          icon: <TrainFront size={13} />,
          mapKind: 'transit',
          primary: null,
          secondary:
            transitScore >= 70
              ? 'Well connected'
              : transitScore >= 50
                ? 'Moderate service'
                : 'Limited service',
          chips: [`Transit score ${Math.round(transitScore)}`],
        }
      : {
          key: 'transit',
          title: 'Transit',
          icon: <TrainFront size={13} />,
          mapKind: 'transit',
          primary: null,
          secondary: 'No transit data for this area yet',
          chips: [],
        }

  const tiles: Array<TileData | null> = [
    transitTile,
    {
      key: 'parks',
      title: 'Nature & parks',
      icon: <TreePine size={13} />,
      mapKind: 'parks',
      primary: parksSel.nearest[0] ?? null,
      secondary:
        parksWithin15 >= 2 ? `${parksWithin15} parks within 15 min` : moreLine(parksSel.moreCount),
      chips: [],
    },
    {
      key: 'schools',
      title: 'Schools',
      icon: <GraduationCap size={13} />,
      mapKind: 'schools',
      primary: schoolsSel.nearest[0] ?? null,
      secondary: moreLine(schoolsSel.moreCount),
      chips: [],
    },
    {
      key: 'shop',
      title: 'Shop & eat',
      icon: <ShoppingBag size={13} />,
      mapKind: 'shop',
      primary: null,
      secondary: null,
      chips: shopBuckets.map((b) => `${b.count} ${b.label}`),
    },
  ]

  // A category with nothing to say drops out and the grid reflows.
  return tiles.filter(
    (t): t is TileData => t !== null && (t.primary !== null || t.chips.length > 0),
  )
}

/** Cold-start rail rows — the area's actual strengths, never invented. */
function deriveAreaStrengths(livability: NeighbourhoodDetailResponse['livability']): RailReason[] {
  // Raw sub-scores arrive as floats — display whole numbers only.
  const { walkability, schools, amenities, transit } = livability.breakdown
  const rows: Array<RailReason & { score: number }> = []
  if (walkability >= 70)
    rows.push({ lead: `Walkability ${Math.round(walkability)}`, tail: 'most errands on foot', tone: 'good', score: walkability })
  if (amenities >= 70)
    rows.push({ lead: `Amenities ${Math.round(amenities)}`, tail: 'daily needs close by', tone: 'good', score: amenities })
  if (transit != null && transit >= 60)
    rows.push({ lead: `Transit ${Math.round(transit)}`, tail: 'well connected', tone: 'good', score: transit })
  if (schools >= 70)
    rows.push({ lead: `Schools ${Math.round(schools)}`, tail: 'strong access nearby', tone: 'good', score: schools })
  return rows
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map(({ lead, tail, tone }) => ({ lead, tail, tone }))
}

export default function NeighbourhoodContextScore({ property, detail }: NeighbourhoodContextScoreProps) {
  const homeLat = property.latitude
  const homeLng = property.longitude

  // ── Degraded: no neighbourhood resolved — map only, nothing invented. ─────
  if (!detail) {
    return (
      <section>
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="font-heading text-xl font-semibold text-[#111111]">Around this home</h2>
        </div>
        <div className="aspect-[2/1] overflow-hidden rounded-2xl border border-[#E8E6E1] bg-white shadow-sm">
          <NeighbourhoodMiniMap latitude={homeLat} longitude={homeLng} address={property.address} />
        </div>
      </section>
    )
  }

  const { neighbourhood, livability, personalization } = detail
  const tiles = buildTiles(detail, homeLat, homeLng)

  // One dot per shown tile category (nearest POI of each).
  const mapPois: MiniMapPoi[] = tiles.flatMap((t) => {
    const source =
      t.key === 'shop'
        ? nearestPois(detail.localEssentials.shopAndEat, homeLat, homeLng, 1).nearest[0]
        : t.primary
    if (!source) return []
    return [
      {
        id: `${t.key}-${source.id}`,
        name: source.name,
        lat: source.lat,
        lng: source.lng,
        kind: t.mapKind,
      },
    ]
  })

  return (
    <section>
      {/* ── Section head ─────────────────────────────────────────────────── */}
      <div className="mb-4 flex items-baseline justify-between gap-4">
        <h2 className="min-w-0 truncate font-heading text-xl font-semibold text-[#111111]">
          Life around {property.address}
        </h2>
        <Link
          href={`/neighbourhoods/${neighbourhood.slug}`}
          className="whitespace-nowrap text-xs font-medium text-[#1C3829] hover:underline"
        >
          View full profile →
        </Link>
      </div>

      {/* ── Evidence left · verdict right ────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.62fr_1fr]">
        <div className="min-w-0">
          {/* Map. aspect-[2/1] matches the 800×400 static image so the
              client-drawn overlay stays registered with the basemap. */}
          <div className="aspect-[2/1] overflow-hidden rounded-2xl border border-[#E8E6E1] bg-white shadow-sm">
            <NeighbourhoodMiniMap
              latitude={homeLat}
              longitude={homeLng}
              address={property.address}
              neighbourhoodName={neighbourhood.name}
              city={neighbourhood.city}
              boundary={neighbourhood.boundary}
              pois={mapPois}
            />
          </div>

          {/* Essentials tiles */}
          {tiles.length > 0 && (
            <div className="mt-2.5 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {tiles.map((tile) => (
                <div
                  key={tile.key}
                  className="rounded-xl border border-[#E8E6E1] bg-white p-3.5 shadow-sm"
                >
                  <div className="mb-2 flex items-center gap-2">
                    <span className="flex h-[26px] w-[26px] items-center justify-center rounded-lg bg-[#EAF0EC] text-[#1C3829]">
                      {tile.icon}
                    </span>
                    <h3 className="text-[12.5px] font-semibold text-[#111111]">{tile.title}</h3>
                  </div>

                  {tile.primary && (
                    <div className="flex items-baseline justify-between gap-2 text-xs leading-relaxed text-[#333333]">
                      <span className="min-w-0 truncate">{tile.primary.name}</span>
                      {poiDistanceLabel(tile.primary) && (
                        <span className="whitespace-nowrap tabular-nums text-[#6B6B6B]">
                          {poiDistanceLabel(tile.primary)}
                        </span>
                      )}
                    </div>
                  )}

                  {tile.chips.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {tile.chips.map((chip) => (
                        <span
                          key={chip}
                          className="rounded-full bg-[#F2F0EB] px-2.5 py-1 text-[11px] text-[#444444]"
                        >
                          {chip}
                        </span>
                      ))}
                    </div>
                  )}

                  {tile.secondary && (
                    <p className="mt-1 text-[11px] font-semibold text-[#1C3829]">{tile.secondary}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Verdict rail (client boundary — personalization hangs here). */}
        <VerdictRail
          slug={neighbourhood.slug}
          livability={livability}
          personalization={personalization}
          areaStrengths={deriveAreaStrengths(livability)}
        />
      </div>
    </section>
  )
}
