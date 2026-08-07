'use client'

// SEO-03 — client island around the Local essentials grid.
//
// Five of the six cards (Schools · Healthcare · Nature & parks · Shop & eat ·
// Transit) are OSM-derived and arrive as props from the server, so they render
// into the HTML. The sixth, "Housing age", is a build-year profile of the ACTIVE
// DDF LISTINGS — DDF-derived, so it is fed from the client query and appears only
// after hydration. `LocalEssentials` already hides that card when `housingAge` is
// absent, which is exactly the pre-hydration state, so the grid needs no change.
//
// ⚠️ N-02: `localEssentials` below is the REDUCED summary, not the POI arrays.
// Props on this boundary are paid for twice — once serialised into the HTML, once
// again when this island refetches the same payload — so the full arrays cost
// ~103 KB + ~107 KB on kitsilano for six counts and nine names. Keep the trim in
// `toLocalEssentialsSummary`; do not widen this prop back to the raw shape.
import { useNeighbourhoodDetail } from '@/hooks/useNeighbourhoodDetail'
import LocalEssentials from './LocalEssentials'
import type { NeighbourhoodDetailResponse } from '@/types/neighbourhood-detail'
import type { LocalEssentialsSummary } from './nonDdfDetail'

interface Props {
  slug: string
  localEssentials: LocalEssentialsSummary
  neighbourhood: NeighbourhoodDetailResponse['neighbourhood']
}

export default function LocalEssentialsIsland({ slug, localEssentials, neighbourhood }: Props) {
  const { data } = useNeighbourhoodDetail(slug)

  return (
    <LocalEssentials
      localEssentials={localEssentials}
      neighbourhood={neighbourhood}
      housingAge={data?.housingAge}
    />
  )
}
