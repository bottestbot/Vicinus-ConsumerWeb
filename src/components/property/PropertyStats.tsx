// FE-403: PropertyStats — price, beds, baths, type, sqft, parking
import { Bed, Bath, Maximize2, Car, Home, Tag } from 'lucide-react'
import { formatFullPrice } from '@/types/search'
import type { PropertyDetail } from '@/types/property'

interface PropertyStatsProps {
  property: PropertyDetail
}

export default function PropertyStats({ property }: PropertyStatsProps) {
  const statItems = [
    {
      icon: <Tag size={14} className="text-[#6B6B6B]" />,
      label: 'Type',
      value: property.propertyType,
    },
    {
      icon: <Home size={14} className="text-[#6B6B6B]" />,
      label: 'Price',
      value: formatFullPrice(property.price),
    },
    {
      icon: <Bed size={14} className="text-[#6B6B6B]" />,
      label: 'Beds',
      value: `${property.beds} Bed`,
    },
    {
      icon: <Bath size={14} className="text-[#6B6B6B]" />,
      label: 'Baths',
      value: `${property.baths} Bath`,
    },
    {
      icon: <Maximize2 size={14} className="text-[#6B6B6B]" />,
      label: 'Size',
      value: `${property.sqft.toLocaleString()} sqft`,
    },
    ...(property.parking != null
      ? [
          {
            icon: <Car size={14} className="text-[#6B6B6B]" />,
            label: 'Parking',
            value: `${property.parking} Space${property.parking !== 1 ? 's' : ''}`,
          },
        ]
      : []),
  ]

  return (
    <div className="space-y-4">
      {/* ── Address ─────────────────────────────────────────────────────── */}
      <div className="flex items-start gap-3">
        {property.daysOnMarket <= 7 && (
          <span className="mt-1.5 bg-[#1C3829] text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest shrink-0">
            New
          </span>
        )}
        <div>
          <h1 className="font-heading text-3xl md:text-4xl font-semibold text-[#111111] leading-tight">
            {property.address},
          </h1>
          <h1 className="font-heading text-3xl md:text-4xl font-semibold text-[#111111] leading-tight">
            {property.city}, {property.province}
          </h1>
        </div>
      </div>

      {/* ── Stats Strip ─────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-0 text-sm text-[#6B6B6B]">
        {statItems.map((item, i) => (
          <span key={item.label} className="flex items-center">
            {i > 0 && <span className="mx-3 text-[#D1CEC9]">|</span>}
            <span className="flex items-center gap-1.5">
              {item.icon}
              <span className="text-[#111111] font-medium">{item.value}</span>
            </span>
          </span>
        ))}
      </div>

      {/* ── MLS / Year Built ─────────────────────────────────────────────── */}
      <div className="flex items-center gap-4 text-xs text-[#6B6B6B]">
        <span>MLS® {property.mlsNumber}</span>
        {property.yearBuilt && <span>Built {property.yearBuilt}</span>}
        {property.daysOnMarket > 0 && (
          <span>{property.daysOnMarket} days on market</span>
        )}
      </div>

      {/* ── Description ─────────────────────────────────────────────────── */}
      {property.description && (
        <p className="text-sm text-[#6B6B6B] leading-relaxed max-w-2xl">
          {property.description}
        </p>
      )}

      {/* ── Features ────────────────────────────────────────────────────── */}
      {property.features && property.features.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {property.features.map((f) => (
            <span
              key={f}
              className="text-xs bg-[#F2F0EB] text-[#6B6B6B] px-2.5 py-1 rounded-full border border-[#E8E6E1]"
            >
              {f}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
