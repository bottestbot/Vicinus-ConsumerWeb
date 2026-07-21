'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Star } from 'lucide-react'
import { useSearchStore } from '@/store/searchStore'
import type { Property } from '@/types/search'
import PropertyCell from '@/components/property/PropertyCell'

interface SearchResultCardProps {
  property: Property
}

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&q=80'

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
            src={property.imageUrl || FALLBACK_IMAGE}
            alt={property.address}
            fill
            sizes="(max-width: 768px) 100vw, 400px"
            className="object-cover object-left-top group-hover:scale-105 transition-transform duration-500"
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

        {/* Content — standardized listing-info cell (Task #12) */}
        <div className="p-3.5">
          <PropertyCell
            data={{
              price: property.price,
              address: property.address,
              location: [`${property.city}, ${property.province}`, property.postalCode]
                .filter(Boolean)
                .join(' '),
              beds: property.beds,
              baths: property.baths,
              sqft: property.sqft,
              propertyType: property.propertyType,
              agentName: property.agentName,
              brokerageName: property.brokerageName,
              mlsNumber: property.mlsNumber,
              realtorUrl: property.realtorUrl,
              listingKey: property.id,
            }}
          />
        </div>
      </article>
    </div>
  )
}
