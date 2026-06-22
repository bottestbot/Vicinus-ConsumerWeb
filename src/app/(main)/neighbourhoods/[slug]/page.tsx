// FE-501: Neighbourhood Detail Page
// NOTE: params is a Promise<{ slug }> in Next.js 15/16 App Router — must be awaited
import type { Metadata } from 'next'
import {
  getNeighbourhood,
  getNeighbourhoodListings,
  getNeighbourhoodEssentials,
  getNeighbourhoodAgents,
} from '@/lib/api/neighbourhoods'
import {
  geocodeNeighbourhood,
  getNeighbourhoodMapImageUrl,
  getUnsplashPhotos,
} from '@/lib/neighbourhood-images'
import NeighbourhoodHero from '@/components/neighbourhood/NeighbourhoodHero'
import NeighbourhoodMetrics from '@/components/neighbourhood/NeighbourhoodMetrics'
import NeighbourhoodBio from '@/components/neighbourhood/NeighbourhoodBio'
import LocalEssentials from '@/components/neighbourhood/LocalEssentials'
import LiveListings from '@/components/neighbourhood/LiveListings'
import NeighbourhoodFlavors from '@/components/neighbourhood/NeighbourhoodFlavors'
import AreaSpecialists from '@/components/neighbourhood/AreaSpecialists'
import NeighbourhoodCTA from '@/components/neighbourhood/NeighbourhoodCTA'

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const neighbourhood = await getNeighbourhood(slug)
  return {
    title: neighbourhood.name,
    description: neighbourhood.bio?.slice(0, 155) ?? `Explore luxury real estate in ${neighbourhood.name}, ${neighbourhood.city}.`,
  }
}

export default async function NeighbourhoodDetailPage({ params }: PageProps) {
  const { slug } = await params

  const [neighbourhood, listings, essentials, agents] = await Promise.all([
    getNeighbourhood(slug),
    getNeighbourhoodListings(slug),
    getNeighbourhoodEssentials(slug),
    getNeighbourhoodAgents(slug),
  ])

  const [coords, photos] = await Promise.all([
    geocodeNeighbourhood(neighbourhood.name, neighbourhood.city),
    getUnsplashPhotos(`${neighbourhood.name} ${neighbourhood.city}`),
  ])
  const mapImageUrl = coords ? getNeighbourhoodMapImageUrl(coords.lat, coords.lng) : undefined

  return (
    <div className="min-h-screen bg-[#FAF9F6] pt-16 pb-16 font-ui">
      {/* ── Hero + Metrics ──────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6">
        <div className="grid lg:grid-cols-[1fr_340px] gap-5 h-[520px]">
          <NeighbourhoodHero neighbourhood={neighbourhood} mapImageUrl={mapImageUrl} />
          <NeighbourhoodMetrics neighbourhood={neighbourhood} />
        </div>
      </div>

      {/* ── Content sections ────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <NeighbourhoodBio neighbourhood={neighbourhood} />
        <LocalEssentials essentials={essentials} />
        <LiveListings listings={listings} slug={slug} />
        <NeighbourhoodFlavors name={neighbourhood.name} photos={photos} />
        <AreaSpecialists agents={agents} neighbourhoodName={neighbourhood.name} />
        <NeighbourhoodCTA name={neighbourhood.name} slug={slug} />
      </div>
    </div>
  )
}
