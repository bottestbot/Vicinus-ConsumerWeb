'use client'

import { useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Bed, Bath, ChevronLeft, ChevronRight } from 'lucide-react'
import { formatPrice } from '@/types/search'
import type { NeighbourhoodListing } from '@/types/neighbourhood'

interface Props {
  listings: NeighbourhoodListing[]
  slug: string
}

function ListingCard({ listing }: { listing: NeighbourhoodListing }) {
  const router = useRouter()

  return (
    // div instead of Link to avoid nested <a> (REALTOR.ca compliance link is inside)
    <div
      role="link"
      tabIndex={0}
      className="group shrink-0 w-60 cursor-pointer"
      onClick={() => router.push(`/properties/${listing.id}`)}
      onKeyDown={(e) => e.key === 'Enter' && router.push(`/properties/${listing.id}`)}
    >
      <article className="bg-white rounded-xl border border-[#E8E6E1] overflow-hidden group-hover:border-[#1C3829]/40 group-hover:shadow-md transition-all duration-200">
        <div className="relative h-40 overflow-hidden bg-[#F2F0EB]">
          <Image
            src={listing.imageUrl}
            alt={listing.address}
            fill
            sizes="240px"
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </div>
        <div className="p-3.5">
          <p className="font-heading text-lg font-semibold text-[#111111] mb-0.5">
            {formatPrice(listing.price)}
          </p>
          <p className="text-xs text-[#111111] truncate mb-2">{listing.address}</p>
          <div className="flex items-center gap-2.5 text-xs text-[#6B6B6B]">
            <span className="flex items-center gap-1">
              <Bed size={11} /> {listing.beds} bd
            </span>
            <span className="text-[#E8E6E1]">|</span>
            <span className="flex items-center gap-1">
              <Bath size={11} /> {listing.baths} ba
            </span>
          </div>
          {/* CREA DDF compliance */}
          <div className="mt-2.5 pt-2 border-t border-[#F2F0EB] flex items-center justify-between">
            <p className="text-[9px] text-[#6B6B6B] truncate">{listing.agentName}</p>
            <a
              href="https://www.realtor.ca"
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-[9px] text-[#6B6B6B] hover:text-[#1C3829] transition-colors shrink-0"
            >
              REALTOR.ca
            </a>
          </div>
        </div>
      </article>
    </div>
  )
}

export default function LiveListings({ listings, slug }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null)

  function scroll(dir: 'left' | 'right') {
    if (!scrollRef.current) return
    scrollRef.current.scrollBy({ left: dir === 'right' ? 280 : -280, behavior: 'smooth' })
  }

  if (listings.length === 0) {
    return (
      <section className="py-10 border-b border-[#E8E6E1]">
        <h2 className="font-heading text-3xl font-semibold text-[#111111] mb-4">Live Listings.</h2>
        <p className="text-sm text-[#6B6B6B]">No active listings at this time — check back soon.</p>
      </section>
    )
  }

  return (
    <section className="py-10 border-b border-[#E8E6E1]">
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-[11px] font-semibold text-[#1C3829] uppercase tracking-widest mb-1">
            Real Estate Results
          </p>
          <h2 className="font-heading text-3xl font-semibold text-[#111111]">Live Listings.</h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => scroll('left')}
            aria-label="Scroll left"
            className="w-8 h-8 rounded-full border border-[#E8E6E1] bg-white flex items-center justify-center hover:border-[#1C3829] transition-colors"
          >
            <ChevronLeft size={14} className="text-[#111111]" />
          </button>
          <button
            onClick={() => scroll('right')}
            aria-label="Scroll right"
            className="w-8 h-8 rounded-full border border-[#E8E6E1] bg-white flex items-center justify-center hover:border-[#1C3829] transition-colors"
          >
            <ChevronRight size={14} className="text-[#111111]" />
          </button>
          <Link
            href={`/search?neighbourhood=${slug}`}
            className="ml-2 text-xs font-semibold text-[#1C3829] hover:underline hidden sm:block"
          >
            See All →
          </Link>
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
    </section>
  )
}
