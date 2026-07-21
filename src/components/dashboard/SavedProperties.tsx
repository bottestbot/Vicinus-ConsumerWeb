'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Heart, ChevronLeft, ChevronRight, Bookmark, Calendar } from 'lucide-react'
import type { SavedPropertyRecord } from '@/types/dashboard'
import PropertyCell from '@/components/property/PropertyCell'

const CARDS_PER_PAGE = 3

function buildAddress(p: SavedPropertyRecord['property']): string {
  const street =
    p.streetNumber && p.streetName ? `${p.streetNumber} ${p.streetName}` : null
  return [street, p.city].filter(Boolean).join(', ') || 'Address not available'
}

interface CardProps {
  record: SavedPropertyRecord
}

function PropertyCard({ record }: CardProps) {
  const { property } = record
  const imageUrl =
    property.primaryPhotoUrl ||
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&q=80'

  return (
    <div className="group bg-white rounded-xl overflow-hidden border border-[#E8E6E1] hover:border-[#1C3829]/40 hover:shadow-md transition-all duration-200 flex flex-col">
      <Link href={`/properties/${property.id}`} className="flex-1 flex flex-col">
        {/* Photo */}
        <div className="relative h-44 overflow-hidden bg-[#F2F0EB] shrink-0">
          <Image
            src={imageUrl}
            alt={buildAddress(property)}
            fill
            sizes="(max-width: 768px) 100vw, 320px"
            className="object-cover object-left-top group-hover:scale-105 transition-transform duration-500"
          />
          {/* Red heart top-right */}
          <div className="absolute top-2.5 right-2.5">
            <span className="bg-white/90 rounded-full w-7 h-7 flex items-center justify-center shadow-sm">
              <Heart size={13} className="fill-red-500 text-red-500" />
            </span>
          </div>
        </div>

        {/* Info — standardized listing-info cell (Task #12) */}
        <div className="p-3.5 flex-1">
          <PropertyCell
            data={{
              price: property.price,
              address: buildAddress(property),
              beds: property.beds,
              baths: property.baths,
              sqft: property.sqft,
              agentName: property.agentName,
              brokerageName: property.brokerageName,
              mlsNumber: property.mlsNumber,
              realtorUrl: property.realtorUrl,
            }}
          />
        </div>
      </Link>

      {/* Schedule Tour CTA */}
      <div className="px-3.5 pb-3.5">
        <button className="w-full bg-[#1C3829] text-white text-[11px] font-bold py-2.5 rounded-xl uppercase tracking-widest hover:bg-[#2D5A3D] transition-colors flex items-center justify-center gap-1.5">
          <Calendar size={12} />
          Schedule Tour
        </button>
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-14 text-center">
      <div className="w-12 h-12 rounded-full bg-[#F2F0EB] flex items-center justify-center mb-3">
        <Bookmark size={22} className="text-[#6B6B6B]" />
      </div>
      <p className="font-semibold text-[#111111] mb-1">You haven&apos;t saved any properties yet</p>
      <p className="text-sm text-[#6B6B6B] max-w-xs">
        Start exploring and save the listings you love — they&apos;ll appear here.
      </p>
      <Link
        href="/search"
        className="mt-4 text-sm font-semibold text-[#1C3829] hover:underline"
      >
        Start exploring →
      </Link>
    </div>
  )
}

interface Props {
  saved: SavedPropertyRecord[]
}

export default function SavedProperties({ saved }: Props) {
  const [page, setPage] = useState(0)

  const totalPages = Math.ceil(saved.length / CARDS_PER_PAGE)
  const visible = saved.slice(page * CARDS_PER_PAGE, (page + 1) * CARDS_PER_PAGE)

  return (
    <section id="saved">
      <div className="flex items-start justify-between mb-5">
        <div>
          <h2 className="font-heading text-2xl font-semibold text-[#111111] mb-1">
            Saved Properties
          </h2>
          <p className="text-sm text-[#6B6B6B]">
            Properties you&apos;ve shortlisted for serious consideration.
          </p>
        </div>

        {/* Arrow controls */}
        {totalPages > 1 && (
          <div className="flex items-center gap-2 mt-1">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="w-8 h-8 rounded-full border border-[#E8E6E1] flex items-center justify-center text-[#6B6B6B] hover:border-[#1C3829] hover:text-[#1C3829] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={15} />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="w-8 h-8 rounded-full border border-[#E8E6E1] flex items-center justify-center text-[#6B6B6B] hover:border-[#1C3829] hover:text-[#1C3829] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={15} />
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {saved.length === 0 ? (
          <EmptyState />
        ) : (
          visible.map((record) => <PropertyCard key={record.id} record={record} />)
        )}
      </div>
    </section>
  )
}
