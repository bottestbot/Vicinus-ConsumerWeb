'use client'

// FE-406: NearbyOpenHouses — cards carousel
import { useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react'
import type { OpenHouseProperty } from '@/types/property'
import { formatOpenHouseTimeRange } from '@/lib/format'
import PropertyCell, { ListingAttribution } from '@/components/property/PropertyCell'
import AddToScheduleButton from './AddToScheduleButton'

interface NearbyOpenHousesProps {
  openHouses: OpenHouseProperty[]
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00')
  return date.toLocaleDateString('en-CA', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

export default function NearbyOpenHouses({ openHouses }: NearbyOpenHousesProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  function scroll(dir: 'left' | 'right') {
    const el = scrollRef.current
    if (!el) return
    el.scrollBy({ left: dir === 'right' ? 300 : -300, behavior: 'smooth' })
  }

  if (!openHouses.length) return null

  return (
    <section>
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-heading text-xl font-semibold text-[#111111]">
          Nearby Open Houses
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => scroll('left')}
            className="w-8 h-8 rounded-full border border-[#E8E6E1] flex items-center justify-center text-[#6B6B6B] hover:border-[#1C3829] hover:text-[#1C3829] transition-colors"
          >
            <ChevronLeft size={15} />
          </button>
          <button
            onClick={() => scroll('right')}
            className="w-8 h-8 rounded-full border border-[#E8E6E1] flex items-center justify-center text-[#6B6B6B] hover:border-[#1C3829] hover:text-[#1C3829] transition-colors"
          >
            <ChevronRight size={15} />
          </button>
        </div>
      </div>

      {/* ── Carousel ────────────────────────────────────────────────────── */}
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto scrollbar-hide pb-2 -mx-1 px-1"
        style={{ scrollSnapType: 'x mandatory', scrollbarWidth: 'none' }}
      >
        {openHouses.map((oh) => (
          <Link
            key={oh.id}
            href={`/properties/${oh.id}`}
            className="shrink-0 w-72 bg-white rounded-2xl border border-[#E8E6E1] shadow-sm overflow-hidden hover:shadow-md hover:border-[#1C3829]/30 transition-all duration-200 group"
            style={{ scrollSnapAlign: 'start' }}
          >
            {/* Image */}
            <div className="relative h-44 overflow-hidden bg-[#F2F0EB]">
              <Image
                src={oh.imageUrl}
                alt={oh.address}
                fill
                sizes="288px"
                className="object-cover object-left-top group-hover:scale-105 transition-transform duration-500"
              />
              {/* Open house badge — forest green */}
              <div className="absolute top-3 left-3">
                <span className="bg-[#1C3829] text-white text-[10px] font-semibold px-2.5 py-1 rounded-full flex items-center gap-1.5">
                  <Clock size={9} />
                  Open House
                </span>
              </div>
            </div>

            {/* Content — standardized listing-info cell (Task #12) */}
            <div className="p-4">
              <PropertyCell
                className="mb-3"
                showAttribution={false}
                data={{
                  price: oh.price,
                  address: oh.address,
                  location: [oh.city, oh.province].filter(Boolean).join(', '),
                  beds: oh.beds,
                  baths: oh.baths,
                  sqft: oh.sqft,
                }}
              />

              {/* Open house time */}
              <div className="bg-[#F7F5F0] rounded-lg px-3 py-2 flex items-center justify-between gap-2">
                <div>
                  <p className="text-[11px] font-semibold text-[#1C3829]">
                    {formatDate(oh.openHouseDate)}
                  </p>
                  <p className="text-[11px] text-[#6B6B6B]">
                    {formatOpenHouseTimeRange(oh.openHouseStartTime, oh.openHouseEndTime)}
                  </p>
                </div>
                <AddToScheduleButton
                  openHouseKey={oh.openHouseKey}
                  currentListingId={oh.id}
                  className="shrink-0 text-[9px] px-2 py-1"
                />
              </div>

              {/* Agent / CREA compliance */}
              <ListingAttribution
                className="mt-3"
                agentName={oh.agentName}
                brokerageName={oh.brokerageName}
                realtorUrl={oh.realtorUrl}
                listingKey={oh.id}
              />
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
