'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Clock, ChevronLeft, ChevronRight } from 'lucide-react'
import type { VisitedPropertyRecord } from '@/types/dashboard'
import PropertyCell from '@/components/property/PropertyCell'

const CARDS_PER_PAGE = 2

function buildAddress(p: VisitedPropertyRecord['property']): string {
  const street =
    p.streetNumber && p.streetName ? `${p.streetNumber} ${p.streetName}` : null
  return [street, p.city].filter(Boolean).join(', ') || 'Address not available'
}

function formatVisitDate(visitedAt: string): string {
  const d = new Date(visitedAt)
  const month = d.toLocaleString('en-US', { month: 'short' }).toUpperCase()
  const day = d.getDate()
  return `VISITED ${month} ${day}`
}

// Mock status tags (alternating for demo)
const STATUS_OPTIONS: Array<'OFFER PENDING' | 'FAVORITE'> = ['OFFER PENDING', 'FAVORITE']

function VisitedCard({ record, index }: { record: VisitedPropertyRecord; index: number }) {
  const { property } = record
  const imageUrl =
    property.primaryPhotoUrl ||
    'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=400&q=80'
  const status = STATUS_OPTIONS[index % STATUS_OPTIONS.length]
  const visitLabel = formatVisitDate(record.visitedAt)

  return (
    <div className="group bg-white rounded-xl overflow-hidden border border-[#E8E6E1] hover:border-[#1C3829]/40 hover:shadow-md transition-all duration-200 flex h-44">
      {/* Left: photo */}
      <div className="relative w-2/5 shrink-0 overflow-hidden bg-[#F2F0EB]">
        <Image
          src={imageUrl}
          alt={buildAddress(property)}
          fill
          sizes="200px"
          className="object-cover object-left-top group-hover:scale-105 transition-transform duration-500"
        />
        {/* Date badge */}
        <div className="absolute top-2.5 left-2.5">
          <span className="bg-black/70 text-white text-[9px] font-bold px-2.5 py-1 rounded-full uppercase tracking-widest">
            {visitLabel}
          </span>
        </div>
      </div>

      {/* Right: info */}
      <div className="flex-1 p-3.5 flex flex-col justify-between min-w-0">
        <div>
          {/* Standardized listing-info cell (Task #12) */}
          <PropertyCell
            compact
            showAttribution={false}
            data={{
              price: property.price,
              address: buildAddress(property),
              beds: property.beds,
              baths: property.baths,
              sqft: property.sqft,
            }}
          />

          {/* Status tag */}
          <span className="inline-block text-[10px] font-semibold text-[#6B6B6B] border border-[#E8E6E1] px-2 py-0.5 rounded-full uppercase tracking-wide mt-2">
            {status}
          </span>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {(['SHORTLIST', 'DOCS'] as const).map((action) => (
            <button
              key={action}
              className="text-[10px] font-bold text-[#6B6B6B] border border-[#E8E6E1] px-2.5 py-1 rounded-lg uppercase tracking-wide hover:border-[#1C3829] hover:text-[#1C3829] transition-colors"
            >
              {action}
            </button>
          ))}
          <button className="text-[10px] font-bold text-white bg-[#1C3829] px-2.5 py-1 rounded-lg uppercase tracking-wide hover:bg-[#2D5A3D] transition-colors">
            OFFER
          </button>
        </div>
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center w-full col-span-2">
      <div className="w-10 h-10 rounded-full bg-[#F2F0EB] flex items-center justify-center mb-3">
        <Clock size={18} className="text-[#6B6B6B]" />
      </div>
      <p className="font-semibold text-[#111111] text-sm mb-1">No recently visited properties</p>
      <p className="text-xs text-[#6B6B6B]">Properties you tour will appear here.</p>
    </div>
  )
}

interface Props {
  visited: VisitedPropertyRecord[]
}

export default function VisitedProperties({ visited }: Props) {
  const [page, setPage] = useState(0)

  const totalPages = Math.ceil(visited.length / CARDS_PER_PAGE)
  const visible = visited.slice(page * CARDS_PER_PAGE, (page + 1) * CARDS_PER_PAGE)

  return (
    <section>
      <div className="flex items-start justify-between mb-5">
        <div>
          <h2 className="font-heading text-2xl font-semibold text-[#111111] mb-1">
            Recently Viewed
          </h2>
          <p className="text-sm text-[#6B6B6B]">Properties you&apos;ve recently looked at.</p>
        </div>

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

      {visited.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {visible.map((record, i) => (
            <VisitedCard key={record.id} record={record} index={page * CARDS_PER_PAGE + i} />
          ))}
        </div>
      )}
    </section>
  )
}
