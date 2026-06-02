'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Bed, Bath, Bookmark, BookmarkX } from 'lucide-react'
import type { SavedPropertyRecord } from '@/types/dashboard'

function formatPrice(price: number | null): string {
  if (!price) return 'Price on request'
  if (price >= 1_000_000) {
    const m = price / 1_000_000
    return `$${m % 1 === 0 ? m.toFixed(0) : m.toFixed(2)}M`
  }
  return `$${price.toLocaleString()}`
}

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
    <div className="group bg-white rounded-xl overflow-hidden border border-[#E8E6E1] hover:border-[#1C3829]/40 hover:shadow-md transition-all duration-200">
      <Link href={`/properties/${property.id}`}>
        <div className="relative h-44 overflow-hidden bg-[#F2F0EB]">
          <Image
            src={imageUrl}
            alt={buildAddress(property)}
            fill
            sizes="(max-width: 768px) 100vw, 320px"
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute top-2.5 left-2.5">
            <span className="bg-white/90 text-[#1C3829] text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
              <Bookmark size={9} className="fill-[#1C3829]" />
              Saved
            </span>
          </div>
        </div>
        <div className="p-3.5">
          <p className="font-heading text-xl font-semibold text-[#111111] mb-0.5">
            {formatPrice(property.price)}
          </p>
          <p className="text-sm text-[#111111] truncate mb-2">{buildAddress(property)}</p>
          <div className="flex items-center gap-3 text-xs text-[#6B6B6B]">
            {property.beds != null && (
              <span className="flex items-center gap-1">
                <Bed size={12} /> {property.beds} bd
              </span>
            )}
            {property.baths != null && (
              <>
                <span className="text-[#E8E6E1]">|</span>
                <span className="flex items-center gap-1">
                  <Bath size={12} /> {property.baths} ba
                </span>
              </>
            )}
          </div>
        </div>
      </Link>
      <div className="px-3.5 pb-3.5">
        <button className="flex items-center gap-1.5 text-xs text-[#6B6B6B] hover:text-red-500 transition-colors">
          <BookmarkX size={13} />
          Remove
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
      <p className="font-semibold text-[#111111] mb-1">You haven't saved any properties yet</p>
      <p className="text-sm text-[#6B6B6B] max-w-xs">
        Start exploring and save the listings you love — they'll appear here.
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
  return (
    <section>
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-[11px] font-semibold text-[#1C3829] uppercase tracking-widest mb-1">
            Your Collection
          </p>
          <h2 className="font-heading text-2xl font-semibold text-[#111111]">
            Saved Properties
          </h2>
        </div>
        {saved.length > 0 && (
          <Link href="/search" className="text-sm text-[#6B6B6B] hover:text-[#1C3829] transition-colors">
            Browse more →
          </Link>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {saved.length === 0 ? (
          <EmptyState />
        ) : (
          saved.map((record) => <PropertyCard key={record.id} record={record} />)
        )}
      </div>
    </section>
  )
}
