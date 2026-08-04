'use client'

// SEO-03 — client island around the live listings carousel.
//
// `liveListings` is DDF data end to end, so the section is fetched in the browser
// and is absent from the server HTML by design (SEO-05 governs whether DDF listing
// content may be indexed at all). While the query is in flight the section shows
// card skeletons rather than the carousel's empty state — "No active listings in
// {name} right now" is a factual claim and must not be made before we've looked.
import { useNeighbourhoodDetail } from '@/hooks/useNeighbourhoodDetail'
import LiveListingsCarousel from './LiveListingsCarousel'

interface Props {
  slug: string
  name: string
}

function LiveListingsSkeleton() {
  return (
    <section className="py-10" aria-busy="true">
      <div className="mb-5 space-y-2">
        <div className="h-3 w-32 animate-pulse rounded bg-[#E8E6E1]" />
        <div className="h-8 w-48 animate-pulse rounded bg-[#E8E6E1]" />
      </div>
      <div className="flex gap-4 overflow-hidden">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-64 w-64 shrink-0 animate-pulse rounded-xl bg-[#E8E6E1]" />
        ))}
      </div>
    </section>
  )
}

export default function LiveListingsIsland({ slug, name }: Props) {
  const { data, isPending } = useNeighbourhoodDetail(slug)

  if (isPending) return <LiveListingsSkeleton />

  return <LiveListingsCarousel liveListings={data?.liveListings ?? []} slug={slug} name={name} />
}
