'use client'

// SEO-03 — client island around the split hero.
//
// The hero mixes provenance: the left panel (photo/map, city pill, <h1>) is ours
// and is the single most valuable thing on the page for search, while the right
// panel's Market Snapshot is DDF-derived. Rather than fork the hero's markup, the
// whole component renders here with `marketSnapshot` supplied from the client
// query — the neighbourhood props still arrive from the server, so the left panel
// and the <h1> land in the server HTML while the DDF numbers do not.
//
// Before the query resolves the snapshot reads as zeroes, which `MarketSnapshot`
// already renders as "—" (its genuine no-data state). Walk/Transit come from the
// livability breakdown, so those are populated server-side from the start.
import { useNeighbourhoodDetail } from '@/hooks/useNeighbourhoodDetail'
import NeighbourhoodHero from './NeighbourhoodHero'
import type { NeighbourhoodDetailResponse } from '@/types/neighbourhood-detail'

/** Renders as "—" in every stat — never a fabricated $0. */
const NO_MARKET_DATA: NeighbourhoodDetailResponse['marketSnapshot'] = {
  medianPrice: 0,
  priceChange30d: 0,
  daysOnMarket: 0,
  activeListings: 0,
}

interface Props {
  slug: string
  neighbourhood: NeighbourhoodDetailResponse['neighbourhood']
  walkScore: number | null
  transitScore: number | null
  province?: string
}

export default function NeighbourhoodHeroIsland({
  slug,
  neighbourhood,
  walkScore,
  transitScore,
  province,
}: Props) {
  const { data } = useNeighbourhoodDetail(slug)

  return (
    <NeighbourhoodHero
      neighbourhood={neighbourhood}
      marketSnapshot={data?.marketSnapshot ?? NO_MARKET_DATA}
      walkScore={walkScore}
      transitScore={transitScore}
      province={province}
    />
  )
}
