// FE-403: PropertyStats — dark summary card (address/price/icon stats) + description
import { Bed, Bath, Maximize2, Car, CalendarDays, type LucideIcon } from 'lucide-react'
import { formatFullPrice } from '@/types/search'
import type { PropertyDetail } from '@/types/property'

interface PropertyStatsProps {
  property: PropertyDetail
}

export default function PropertyStats({ property }: PropertyStatsProps) {
  const iconStats: { icon: LucideIcon; label: string; value: string }[] = [
    { icon: Bed, label: 'Beds', value: `${property.beds} Bed` },
    { icon: Bath, label: 'Baths', value: `${property.baths} Bath` },
    // Only show Size when DDF supplies LivingArea — otherwise it reads "0 sqft".
    ...(property.sqft > 0
      ? [{ icon: Maximize2, label: 'Size', value: `${property.sqft.toLocaleString()} sqft` }]
      : []),
    ...(property.yearBuilt ? [{ icon: CalendarDays, label: 'Built', value: `Built ${property.yearBuilt}` }] : []),
    ...(property.parking != null
      ? [{ icon: Car, label: 'Parking', value: `${property.parking} Space${property.parking !== 1 ? 's' : ''}` }]
      : []),
  ]

  return (
    <div className="space-y-4">
      {/* ── Summary card ───────────────────────────────────────────────── */}
      <div className="bg-[#1C3829] rounded-2xl px-6 py-6 sm:px-8 sm:py-7 text-white">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              {property.daysOnMarket <= 7 && (
                <span className="bg-white text-[#1C3829] text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest shrink-0">
                  New
                </span>
              )}
              {property.neighbourhood && (
                <p className="text-[11px] font-semibold tracking-widest text-white/60 uppercase truncate">
                  {property.neighbourhood}
                </p>
              )}
            </div>
            <h1 className="font-heading text-2xl sm:text-3xl font-semibold leading-tight">
              {property.address}, {property.city}, {property.province}
            </h1>
          </div>

          <div className="text-left sm:text-right shrink-0">
            <p className="font-heading text-2xl sm:text-3xl font-semibold whitespace-nowrap">
              {/* DDF sometimes omits ListPrice — show a label instead of "$0". */}
              {property.price > 0 ? formatFullPrice(property.price) : 'Price on request'}
            </p>
            {property.propertyType && <p className="text-xs text-white/50 mt-0.5">{property.propertyType}</p>}
          </div>
        </div>

        {iconStats.length > 0 && (
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-5 pt-5 border-t border-white/15">
            {iconStats.map((item) => (
              <span key={item.label} className="flex items-center gap-1.5 text-sm">
                <item.icon size={14} className="text-white/60" />
                <span className="font-medium">{item.value}</span>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ── MLS / Days on market ───────────────────────────────────────── */}
      <div className="flex items-center gap-4 text-xs text-[#6B6B6B]">
        <span>MLS® {property.mlsNumber}</span>
        {property.daysOnMarket > 0 && (
          <span>
            {property.daysOnMarket} day{property.daysOnMarket !== 1 ? 's' : ''} on market
          </span>
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
