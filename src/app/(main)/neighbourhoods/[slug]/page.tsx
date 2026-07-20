// FE-501 / NBHD-16: Neighbourhood Detail Page
// Server shell — owns metadata + page chrome. The redesigned section spine
// (hero, livability, market, tiles, essentials, live listings) is rendered by
// the client <NeighbourhoodDetailBody>, which fetches the aggregate /detail
// payload via TanStack Query. The existing AI summary, area specialists, and CTA
// sections are preserved below the new spine (they read their own endpoints).
// NOTE: params is a Promise<{ slug }> in Next.js 16 App Router — must be awaited.
import type { Metadata } from 'next'
import { getNeighbourhood, getNeighbourhoodAgents } from '@/lib/api/neighbourhoods'
import NeighbourhoodDetailBody from '@/components/neighbourhood/NeighbourhoodDetailBody'
import NeighbourhoodAiSummary from '@/components/neighbourhood/NeighbourhoodAiSummary'
import AreaSpecialists from '@/components/neighbourhood/AreaSpecialists'
import NeighbourhoodCTA from '@/components/neighbourhood/NeighbourhoodCTA'

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const neighbourhood = await getNeighbourhood(slug)
  const description =
    neighbourhood.bio?.slice(0, 155) ??
    `Explore livability, market trends, and live listings in ${neighbourhood.name}, ${neighbourhood.city}.`
  return {
    title: `${neighbourhood.name} — Neighbourhood Guide`,
    description,
  }
}

export default async function NeighbourhoodDetailPage({ params }: PageProps) {
  const { slug } = await params

  const [neighbourhood, agents] = await Promise.all([
    getNeighbourhood(slug),
    getNeighbourhoodAgents(slug),
  ])

  return (
    <div className="min-h-screen bg-[#FAF9F6] pb-16 pt-16 font-ui">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* Redesigned spine (NBHD-10..15) — client, aggregate /detail payload */}
        <NeighbourhoodDetailBody slug={slug} />

        {/* Preserved editorial + conversion sections */}
        <NeighbourhoodAiSummary slug={slug} name={neighbourhood.name} city={neighbourhood.city} />
        <AreaSpecialists agents={agents} neighbourhoodName={neighbourhood.name} />
        <NeighbourhoodCTA name={neighbourhood.name} slug={slug} />
      </div>
    </div>
  )
}
