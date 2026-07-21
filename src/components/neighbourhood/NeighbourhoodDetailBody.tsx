'use client'

// NBHD-D10 — Client body for the neighbourhood detail page. Fetches the aggregate
// payload via useNeighbourhoodDetail and renders the section spine in the approved
// mockup order: split hero → editorial narrative → AI fit card → local essentials
// grid → livability → local information tiles → live listings.
import { useNeighbourhoodDetail } from '@/hooks/useNeighbourhoodDetail'
import NeighbourhoodHero, { NeighbourhoodHeroSkeleton } from './NeighbourhoodHero'
import NeighbourhoodNarrative from './NeighbourhoodNarrative'
import WhyItFitsCard from './WhyItFitsCard'
import LocalEssentials from './LocalEssentials'
import LivabilityPanel from './LivabilityPanel'
import LocalInfoTiles from './LocalInfoTiles'
import LiveListingsCarousel from './LiveListingsCarousel'

interface Props {
  slug: string
  province?: string
}

function LoadingState() {
  return (
    <div className="pt-6">
      <NeighbourhoodHeroSkeleton />
      <div className="mt-8 h-24 animate-pulse rounded-2xl bg-[#E8E6E1]" />
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-40 animate-pulse rounded-xl bg-[#E8E6E1]" />
        ))}
      </div>
    </div>
  )
}

export default function NeighbourhoodDetailBody({ slug, province }: Props) {
  const { data, isLoading, isError } = useNeighbourhoodDetail(slug)

  if (isLoading) return <LoadingState />

  if (isError || !data) {
    return (
      <div className="pt-6">
        <div className="rounded-2xl border border-[#E8E6E1] bg-white p-10 text-center">
          <p className="font-heading text-2xl font-semibold text-[#111111]">
            We couldn&apos;t load this neighbourhood.
          </p>
          <p className="mt-2 text-sm text-[#6B6B6B]">Please try again in a moment.</p>
        </div>
      </div>
    )
  }

  const {
    neighbourhood,
    marketSnapshot,
    livability,
    localEssentials,
    localInfoTiles,
    liveListings,
    personalization,
  } = data

  return (
    <div className="pt-6">
      <NeighbourhoodHero
        neighbourhood={neighbourhood}
        marketSnapshot={marketSnapshot}
        walkScore={livability.breakdown.walkability}
        transitScore={livability.breakdown.transit}
        province={province}
      />

      <NeighbourhoodNarrative neighbourhood={neighbourhood} />

      <WhyItFitsCard name={neighbourhood.name} personalization={personalization} />

      <LocalEssentials localEssentials={localEssentials} neighbourhood={neighbourhood} />

      <div className="py-10 border-b border-[#E8E6E1]">
        <LivabilityPanel livability={livability} city={neighbourhood.city} />
      </div>

      <LocalInfoTiles
        neighbourhood={neighbourhood}
        localInfoTiles={localInfoTiles}
        schoolsCount={localEssentials.schools.length}
        shopCount={localEssentials.shopAndEat.length}
      />

      <LiveListingsCarousel
        liveListings={liveListings}
        slug={neighbourhood.slug}
        name={neighbourhood.name}
      />
    </div>
  )
}
