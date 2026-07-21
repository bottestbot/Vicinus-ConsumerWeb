// FE-501 / NBHD-16 / NBHD-D10: Neighbourhood Detail Page
// Server shell — owns metadata + page chrome. The redesigned section spine (split
// hero → narrative → AI fit card → essentials → livability → info tiles → live
// listings) is rendered by the client <NeighbourhoodDetailBody>, which fetches the
// aggregate /detail payload via TanStack Query. The forest CTA banner closes the page.
// NOTE: params is a Promise<{ slug }> in Next.js 16 App Router — must be awaited.
import type { Metadata } from 'next'
import { getNeighbourhood } from '@/lib/api/neighbourhoods'
import NeighbourhoodDetailBody from '@/components/neighbourhood/NeighbourhoodDetailBody'
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
  const neighbourhood = await getNeighbourhood(slug)

  return (
    <div className="min-h-screen bg-[#FAF9F6] pb-16 pt-16 font-ui">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <NeighbourhoodDetailBody slug={slug} province={neighbourhood.province} />
        <NeighbourhoodCTA name={neighbourhood.name} slug={slug} />
      </div>
    </div>
  )
}
