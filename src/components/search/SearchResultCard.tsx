'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Bed, Bath, Maximize2, Star } from 'lucide-react'
import { useSearchStore } from '@/store/searchStore'
import type { Property } from '@/types/search'
import { formatFullPrice } from '@/types/search'

interface SearchResultCardProps {
  property: Property
}

export default function SearchResultCard({ property }: SearchResultCardProps) {
  const router = useRouter()
  const { hoveredPropertyId, setHoveredProperty, setSelectedProperty } = useSearchStore()
  const isHovered = hoveredPropertyId === property.id

  const openDetail = () => {
    setSelectedProperty(property.id)
    router.push(`/properties/${property.id}`)
  }

  return (
    // div + router.push instead of <Link> to avoid nested <a> (REALTOR.ca link
    // lives inside this card, and nested anchors break click navigation)
    <div role="link" tabIndex={0} className="block cursor-pointer" onClick={openDetail} onKeyDown={(e) => e.key === 'Enter' && openDetail()}>
      <article
        onMouseEnter={() => setHoveredProperty(property.id)}
        onMouseLeave={() => setHoveredProperty(null)}
        className={[
          'group bg-white rounded-xl overflow-hidden border transition-all duration-200 cursor-pointer',
          isHovered
            ? 'border-[#1C3829] shadow-md shadow-[#1C3829]/10'
            : 'border-[#E8E6E1] hover:border-[#1C3829]/40 hover:shadow-md hover:shadow-black/6',
        ].join(' ')}
      >
        {/* Image */}
        <div className="relative h-44 overflow-hidden bg-[#F2F0EB]">
          <Image
            src={property.imageUrl}
            alt={property.address}
            fill
            sizes="(max-width: 768px) 100vw, 400px"
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />

          {/* Status badge */}
          <div className="absolute top-2.5 left-2.5 flex gap-1.5">
            {property.status === 'Active' && property.daysOnMarket <= 3 && (
              <span className="bg-[#1C3829] text-white text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide">
                New Featured
              </span>
            )}
            {property.status === 'Coming Soon' && (
              <span className="bg-amber-500 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide">
                Coming Soon
              </span>
            )}
          </div>

          {/* Match score */}
          {property.matchScore !== undefined && (
            <div className="absolute top-2.5 right-2.5">
              <div className="bg-white/90 backdrop-blur-sm rounded-full px-2 py-0.5 flex items-center gap-1">
                <Star size={10} className="text-[#1C3829] fill-[#1C3829]" />
                <span className="text-[10px] font-semibold text-[#1C3829]">{property.matchScore}% match</span>
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-3.5">
          {/* Price */}
          <p className="font-heading text-xl font-semibold text-[#111111] mb-0.5">
            {formatFullPrice(property.price)}
          </p>

          {/* Address */}
          <p className="text-sm text-[#111111] mb-0.5 truncate">{property.address}</p>
          <p className="text-xs text-[#6B6B6B] mb-2.5">
            {property.city}, {property.province} {property.postalCode}
          </p>

          {/* Stats */}
          <div className="flex items-center gap-3 text-xs text-[#6B6B6B]">
            <span className="flex items-center gap-1">
              <Bed size={12} /> {property.beds} bd
            </span>
            <span className="text-[#E8E6E1]">|</span>
            <span className="flex items-center gap-1">
              <Bath size={12} /> {property.baths} ba
            </span>
            <span className="text-[#E8E6E1]">|</span>
            <span className="flex items-center gap-1">
              <Maximize2 size={12} /> {property.sqft.toLocaleString()} sqft
            </span>
          </div>

          {/* Agent / CREA compliance footer */}
          <div className="mt-3 pt-2.5 border-t border-[#F2F0EB]">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-[10px] font-semibold text-[#111111]">{property.agentName}</p>
                <p className="text-[10px] text-[#6B6B6B]">{property.brokerageName}</p>
              </div>
              <a
                href="https://www.realtor.ca"
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-[9px] text-[#6B6B6B] hover:text-[#1C3829] transition-colors text-right shrink-0"
              >
                Powered by<br />
                <span className="font-semibold">REALTOR.ca</span>
              </a>
            </div>
            <p className="text-xs text-[#6B6B6B] mt-1">Data provided by CREA</p>
          </div>
        </div>
      </article>
    </div>
  )
}
