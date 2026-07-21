import Image from 'next/image'
import { CalendarPlus } from 'lucide-react'
import type { DashboardProperty } from '@/types/dashboard'

function buildAddress(p: DashboardProperty): string {
  const parts = [
    p.streetNumber && p.streetName ? `${p.streetNumber} ${p.streetName}` : null,
    p.city,
    p.province,
  ].filter(Boolean)
  return parts.join(', ') || 'Address not available'
}

interface Props {
  property: DashboardProperty
}

export default function FeaturedProperty({ property }: Props) {
  const imageUrl =
    property.primaryPhotoUrl ||
    'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&q=80'

  const propertyName =
    property.streetNumber && property.streetName
      ? `${property.streetNumber} ${property.streetName}`
      : buildAddress(property)

  return (
    <div className="rounded-2xl overflow-hidden border border-[#E8E6E1] shadow-sm">
      <div className="relative h-72 sm:h-80">
        <Image
          src={imageUrl}
          alt={propertyName}
          fill
          sizes="(max-width: 768px) 100vw, 800px"
          className="object-cover object-left-top"
          priority
        />

        {/* Dark gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

        {/* Top-left: NEXT OPEN HOUSE badge */}
        <div className="absolute top-4 left-4">
          <span className="bg-[#1C3829] text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest">
            Next Open House
          </span>
        </div>

        {/* Bottom overlay: property name + date/time */}
        <div className="absolute bottom-0 left-0 right-0 p-5 flex items-end justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="font-heading text-2xl sm:text-3xl font-semibold text-white mb-1.5 leading-tight">
              {propertyName}
            </p>
            <div className="flex flex-wrap items-center gap-3 text-white/80 text-xs">
              <span>📅 Saturday, Oct 12</span>
              <span>🕑 2:00 PM – 4:30 PM</span>
            </div>
          </div>

          {/* Add to Calendar button */}
          <button className="shrink-0 flex items-center gap-1.5 bg-[#1C3829] text-white text-[11px] font-bold px-3 py-2 rounded-xl uppercase tracking-wide hover:bg-[#2D5A3D] transition-colors whitespace-nowrap">
            <CalendarPlus size={12} />
            Add to Calendar
          </button>
        </div>
      </div>
    </div>
  )
}
