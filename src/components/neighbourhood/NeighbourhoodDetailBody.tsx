'use client'

// NBHD-16 — Client body for the neighbourhood detail page. Fetches the aggregate
// payload via useNeighbourhoodDetail and renders the redesigned section spine:
// Hero → (Livability + Market) → Local Info Tiles → Local Essentials → Live
// Listings. Handles loading and error states.
import { useNeighbourhoodDetail } from '@/hooks/useNeighbourhoodDetail'
import NeighbourhoodHero, { NeighbourhoodHeroSkeleton } from './NeighbourhoodHero'
import LivabilityPanel from './LivabilityPanel'
import MarketSnapshot from './MarketSnapshot'
import LocalInfoTiles from './LocalInfoTiles'
import LocalEssentials from './LocalEssentials'
import LiveListingsCarousel from './LiveListingsCarousel'

interface Props {
  slug: string
}

function LoadingState() {
  return (
    <div className="pt-6">
      <NeighbourhoodHeroSkeleton />
      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <div className="h-64 animate-pulse rounded-2xl bg-[#E8E6E1]" />
        <div className="h-64 animate-pulse rounded-2xl bg-[#E8E6E1]" />
      </div>
      <div className="mt-5 h-56 animate-pulse rounded-2xl bg-[#E8E6E1]" />
    </div>
  )
}

export default function NeighbourhoodDetailBody({ slug }: Props) {
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
      <NeighbourhoodHero neighbourhood={neighbourhood} personalization={personalization} />

      <div className="mt-5 grid gap-5 lg:grid-cols-2 lg:items-start">
        <LivabilityPanel livability={livability} city={neighbourhood.city} />
        <MarketSnapshot marketSnapshot={marketSnapshot} />
      </div>

      <LocalInfoTiles localInfoTiles={localInfoTiles} neighbourhood={neighbourhood} />
      <LocalEssentials localEssentials={localEssentials} />
      <LiveListingsCarousel
        liveListings={liveListings}
        slug={neighbourhood.slug}
        name={neighbourhood.name}
      />
    </div>
  )
}
