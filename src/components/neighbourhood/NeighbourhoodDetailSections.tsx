// SEO-03 — the section spine for the neighbourhood detail page, in the approved
// mockup order: split hero → editorial narrative → AI fit card → local essentials
// grid → livability → local information tiles → live listings.
//
// Deliberately NOT a client component and deliberately NOT a fetcher: it takes the
// non-DDF slice of the detail payload and nothing else. That makes it usable from
// both render paths —
//
//   • the server path (NeighbourhoodDetailBody) renders it as a Server Component,
//     putting the bio, livability bars and OSM essentials into the raw HTML;
//   • the client fallback path (NeighbourhoodDetailClientBody) renders the exact
//     same tree in the browser when the server fetch came back empty.
//
// The DDF-derived sections are the *Island children — each keeps its own client
// query, so no CREA data reaches server-rendered HTML through this component.
import NeighbourhoodHeroIsland from './NeighbourhoodHeroIsland'
import NeighbourhoodNarrative from './NeighbourhoodNarrative'
import WhyItFitsIsland from './WhyItFitsIsland'
import LocalEssentialsIsland from './LocalEssentialsIsland'
import LivabilityPanel from './LivabilityPanel'
import LocalInfoTiles from './LocalInfoTiles'
import LiveListingsIsland from './LiveListingsIsland'
import type { NonDdfNeighbourhoodDetail } from './nonDdfDetail'

interface Props {
  /** Route slug — the query key the DDF islands fetch under. */
  slug: string
  detail: NonDdfNeighbourhoodDetail
  province?: string
}

export default function NeighbourhoodDetailSections({ slug, detail, province }: Props) {
  const { neighbourhood, livability, localEssentials, localInfoTiles } = detail

  return (
    <div className="pt-6">
      <NeighbourhoodHeroIsland
        slug={slug}
        neighbourhood={neighbourhood}
        walkScore={livability.breakdown.walkability}
        transitScore={livability.breakdown.transit}
        province={province}
      />

      <NeighbourhoodNarrative neighbourhood={neighbourhood} />

      <WhyItFitsIsland slug={slug} name={neighbourhood.name} />

      <LocalEssentialsIsland
        slug={slug}
        localEssentials={localEssentials}
        neighbourhood={neighbourhood}
      />

      <div className="py-10 border-b border-[#E8E6E1]">
        <LivabilityPanel livability={livability} />
      </div>

      <LocalInfoTiles
        neighbourhood={neighbourhood}
        localInfoTiles={localInfoTiles}
        schoolsCount={localEssentials.schoolsCount}
        shopCount={localEssentials.shopAndEatCount}
      />

      <LiveListingsIsland slug={slug} name={neighbourhood.name} />
    </div>
  )
}
