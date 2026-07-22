'use client'

// NBHD-D09 — Live listings carousel. Horizontal-scroll CREA cards with a REALTOR®
// badge on the image, a lime "For you" flag on personalized matches (+ lime
// border), and a "See all" link in the section header. Info block + REALTOR.ca
// attribution come from the shared PropertyCell.
import { useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react'
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
  // JUL21FIX-01: the detail page resolves listings DDF-live by ListingKey
  // (GET /search/listing/{key}), NOT by the local Property.id — routing by
  // `listing.id` 404s every time. The API returns the key in `slug`.
  const listingKey = listing.slug
  const goToListing = () => {
    if (listingKey) router.push(`/properties/${listingKey}`)
  }
  const isMatch = listing.isMatch === true

  return (
    <div
      role={listingKey ? 'link' : undefined}
      tabIndex={listingKey ? 0 : undefined}
      className={`group w-64 shrink-0 ${listingKey ? 'cursor-pointer' : ''}`}
      onClick={goToListing}
      onKeyDown={(e) => e.key === 'Enter' && goToListing()}
    >
      <article
        className={`overflow-hidden rounded-xl border bg-white transition-all duration-200 group-hover:shadow-md ${
          isMatch
            ? 'border-[#A3E635] ring-1 ring-[#A3E635]'
            : 'border-[#E8E6E1] group-hover:border-[#1C3829]/40'
        }`}
      >
        <div className="relative h-40 overflow-hidden bg-[#F2F0EB]">
          <Image
            src={listing.imageUrl}
            alt={listing.address}
            fill
            sizes="256px"
            className="object-cover object-left-top transition-transform duration-500 group-hover:scale-105"
          />
          {/* Top-left badge: "For you" on matches, else REALTOR® */}
          {isMatch ? (
            <span className="absolute left-2.5 top-2.5 inline-flex items-center gap-1 rounded-md bg-[#A3E635] px-2 py-0.5 text-[10px] font-semibold text-[#1C3829]">
              <Sparkles size={11} />
              For you
            </span>
          ) : (
            <span className="absolute left-2.5 top-2.5 rounded-md bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-[#1C3829] backdrop-blur-sm">
              REALTOR®
            </span>
          )}
        </div>
        <div className="p-3.5">
          <PropertyCell
            data={{
              price: listing.price,
              leaseFrequency: listing.leaseFrequency,
              address: listing.address,
              beds: listing.beds,
              baths: listing.baths,
              sqft: listing.sqft,
              agentName: listing.agentName,
              brokerageName: listing.brokerageName,
              mlsNumber: listing.mlsNumber,
              realtorUrl: listing.realtorUrl,
              // Also the DDF key, not the local id — this is what gets reported
              // to CREA as the Click event (PropertyCell → logListingClick).
              listingKey,
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

  const Header = (
    <div className="mb-5 flex items-end justify-between gap-4">
      <div>
        <p className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-[#1C3829]">
          Real Estate Results
        </p>
        <h2 className="font-heading text-3xl font-semibold text-[#111111]">Live listings.</h2>
      </div>
      <div className="flex items-center gap-2">
        {listings.length > 0 && (
          <>
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
          </>
        )}
        <Link
          href={`/search?neighbourhood=${slug}`}
          className="ml-1 text-sm font-semibold text-[#1C3829] hover:underline"
        >
          See all →
        </Link>
      </div>
    </div>
  )

  return (
    <section className="py-10">
      {Header}
      {listings.length === 0 ? (
        <p className="text-sm text-[#6B6B6B]">No active listings in {name} right now — check back soon.</p>
      ) : (
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide"
          style={{ scrollbarWidth: 'none' }}
        >
          {listings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}
    </section>
  )
}
