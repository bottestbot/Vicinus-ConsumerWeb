'use client'

// NBHD-15 — Live listings carousel. Horizontal-scroll row of up to six CREA
// listings (image + PropertyCell info block with REALTOR.ca attribution), with a
// "View all listings in {name}" link and an empty state. Mirrors the ref-based
// scroll pattern from LiveListings.tsx.
import { useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import PropertyCell from '@/components/property/PropertyCell'
import type { NeighbourhoodDetailResponse, PropertySummary } from '@/types/neighbourhood-detail'

interface Props {
  liveListings: NeighbourhoodDetailResponse['liveListings']
  slug: string
  name: string
}

const MAX_LISTINGS = 6

function ListingCard({ listing }: { listing: PropertySummary }) {
  const router = useRouter()
  const goToListing = () => router.push(`/properties/${listing.id}`)

  return (
    // div (not Link) to avoid nesting the REALTOR.ca <a> inside another anchor.
    <div
      role="link"
      tabIndex={0}
      className="group w-64 shrink-0 cursor-pointer"
      onClick={goToListing}
      onKeyDown={(e) => e.key === 'Enter' && goToListing()}
    >
      <article className="overflow-hidden rounded-xl border border-[#E8E6E1] bg-white transition-all duration-200 group-hover:border-[#1C3829]/40 group-hover:shadow-md">
        <div className="relative h-40 overflow-hidden bg-[#F2F0EB]">
          <Image
            src={listing.imageUrl}
            alt={listing.address}
            fill
            sizes="256px"
            className="object-cover object-left-top transition-transform duration-500 group-hover:scale-105"
          />
        </div>
        <div className="p-3.5">
          <PropertyCell
            data={{
              price: listing.price,
              address: listing.address,
              beds: listing.beds,
              baths: listing.baths,
              sqft: listing.sqft,
              agentName: listing.agentName,
              brokerageName: listing.brokerageName,
              mlsNumber: listing.mlsNumber,
              realtorUrl: listing.realtorUrl,
            }}
          />
        </div>
      </article>
    </div>
  )
}

export default function LiveListingsCarousel({ liveListings, slug, name }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const listings = liveListings.slice(0, MAX_LISTINGS)

  function scroll(dir: 'left' | 'right') {
    scrollRef.current?.scrollBy({ left: dir === 'right' ? 288 : -288, behavior: 'smooth' })
  }

  if (listings.length === 0) {
    return (
      <section className="py-10">
        <p className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-[#1C3829]">
          Real Estate Results
        </p>
        <h2 className="mb-4 font-heading text-3xl font-semibold text-[#111111]">Live Listings.</h2>
        <p className="text-sm text-[#6B6B6B]">No active listings in {name} right now — check back soon.</p>
      </section>
    )
  }

  return (
    <section className="py-10">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-[#1C3829]">
            Real Estate Results
          </p>
          <h2 className="font-heading text-3xl font-semibold text-[#111111]">Live Listings.</h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => scroll('left')}
            aria-label="Scroll left"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-[#E8E6E1] bg-white transition-colors hover:border-[#1C3829]"
          >
            <ChevronLeft size={14} className="text-[#111111]" />
          </button>
          <button
            onClick={() => scroll('right')}
            aria-label="Scroll right"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-[#E8E6E1] bg-white transition-colors hover:border-[#1C3829]"
          >
            <ChevronRight size={14} className="text-[#111111]" />
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide"
        style={{ scrollbarWidth: 'none' }}
      >
        {listings.map((listing) => (
          <ListingCard key={listing.id} listing={listing} />
        ))}
      </div>

      <Link
        href={`/search?neighbourhood=${slug}`}
        className="mt-5 inline-flex text-sm font-semibold text-[#1C3829] hover:underline"
      >
        View all listings in {name} →
      </Link>
    </section>
  )
}
