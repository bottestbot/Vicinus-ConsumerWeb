import Image from 'next/image'
import Link from 'next/link'
import { Bed, Bath, ArrowRight } from 'lucide-react'
import type { DashboardProperty } from '@/types/dashboard'

function formatPrice(price: number | null): string {
  if (!price) return 'Price on request'
  if (price >= 1_000_000) {
    const m = price / 1_000_000
    return `$${m % 1 === 0 ? m.toFixed(0) : m.toFixed(2)}M`
  }
  return `$${price.toLocaleString()}`
}

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

  return (
    <div className="rounded-2xl overflow-hidden border border-[#E8E6E1] bg-white shadow-sm">
      <div className="relative h-72 sm:h-96">
        <Image
          src={imageUrl}
          alt={buildAddress(property)}
          fill
          sizes="(max-width: 768px) 100vw, 800px"
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        {/* Curator badge */}
        <div className="absolute top-4 left-4">
          <span className="bg-[#1C3829] text-white text-[10px] font-semibold px-3 py-1 rounded-full uppercase tracking-widest">
            Recommended for you
          </span>
        </div>

        {/* Info overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-5">
          <p className="font-heading text-2xl sm:text-3xl font-semibold text-white mb-1">
            {formatPrice(property.price)}
          </p>
          <p className="text-white/90 text-sm mb-3">{buildAddress(property)}</p>
          <div className="flex items-center gap-4">
            {property.beds != null && (
              <span className="flex items-center gap-1.5 text-white/80 text-xs">
                <Bed size={13} />
                {property.beds} bd
              </span>
            )}
            {property.baths != null && (
              <span className="flex items-center gap-1.5 text-white/80 text-xs">
                <Bath size={13} />
                {property.baths} ba
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="p-5 flex items-center justify-between">
        <div>
          {property.agentName && (
            <p className="text-xs text-[#6B6B6B]">
              Listed by <span className="font-semibold text-[#111111]">{property.agentName}</span>
              {property.brokerageName ? ` · ${property.brokerageName}` : ''}
            </p>
          )}
          {property.mlsNumber && (
            <p className="text-[10px] text-[#6B6B6B] mt-0.5">MLS® {property.mlsNumber}</p>
          )}
        </div>
        <Link
          href={`/properties/${property.id}`}
          className="flex items-center gap-1.5 bg-[#1C3829] text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-[#2D5A3D] transition-colors"
        >
          View Property
          <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  )
}
