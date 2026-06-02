import Image from 'next/image'
import Link from 'next/link'
import { Bed, Bath, Clock } from 'lucide-react'
import type { VisitedPropertyRecord } from '@/types/dashboard'

function formatPrice(price: number | null): string {
  if (!price) return 'Price on request'
  if (price >= 1_000_000) {
    const m = price / 1_000_000
    return `$${m % 1 === 0 ? m.toFixed(0) : m.toFixed(2)}M`
  }
  return `$${price.toLocaleString()}`
}

function buildAddress(p: VisitedPropertyRecord['property']): string {
  const street =
    p.streetNumber && p.streetName ? `${p.streetNumber} ${p.streetName}` : null
  return [street, p.city].filter(Boolean).join(', ') || 'Address not available'
}

function VisitedCard({ record }: { record: VisitedPropertyRecord }) {
  const { property } = record
  const imageUrl =
    property.primaryPhotoUrl ||
    'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=400&q=80'

  return (
    <Link href={`/properties/${property.id}`}>
      <div className="group bg-white rounded-xl overflow-hidden border border-[#E8E6E1] hover:border-[#1C3829]/40 hover:shadow-md transition-all duration-200 w-56 shrink-0">
        <div className="relative h-36 overflow-hidden bg-[#F2F0EB]">
          <Image
            src={imageUrl}
            alt={buildAddress(property)}
            fill
            sizes="224px"
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </div>
        <div className="p-3">
          <p className="font-heading text-base font-semibold text-[#111111] mb-0.5">
            {formatPrice(property.price)}
          </p>
          <p className="text-xs text-[#111111] truncate mb-1.5">{buildAddress(property)}</p>
          <div className="flex items-center gap-2 text-[11px] text-[#6B6B6B]">
            {property.beds != null && (
              <span className="flex items-center gap-0.5">
                <Bed size={10} /> {property.beds}
              </span>
            )}
            {property.baths != null && (
              <span className="flex items-center gap-0.5">
                <Bath size={10} /> {property.baths}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center w-full">
      <div className="w-10 h-10 rounded-full bg-[#F2F0EB] flex items-center justify-center mb-3">
        <Clock size={18} className="text-[#6B6B6B]" />
      </div>
      <p className="font-semibold text-[#111111] text-sm mb-1">No recently viewed properties</p>
      <p className="text-xs text-[#6B6B6B]">Properties you visit will appear here.</p>
    </div>
  )
}

interface Props {
  visited: VisitedPropertyRecord[]
}

export default function VisitedProperties({ visited }: Props) {
  return (
    <section>
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-[11px] font-semibold text-[#1C3829] uppercase tracking-widest mb-1">
            Your History
          </p>
          <h2 className="font-heading text-2xl font-semibold text-[#111111]">
            Recently Viewed
          </h2>
        </div>
      </div>
      {visited.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-none">
          {visited.map((record) => (
            <VisitedCard key={record.id} record={record} />
          ))}
        </div>
      )}
    </section>
  )
}
