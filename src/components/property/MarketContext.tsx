// FE-407 / BE-G: MarketContext — real days-on-market, $/sqft, price position,
// and demand computed from live active comparables in the same city.
import { TrendingUp, TrendingDown, Minus, Activity, Clock, DollarSign, BarChart3 } from 'lucide-react'
import type { PropertyDetail } from '@/types/property'
import type { MarketContextData } from '@/lib/api/properties'

interface MarketContextProps {
  property: PropertyDetail
  /** Real market stats from the BE; when absent we show subject-only values. */
  data?: MarketContextData | null
}

const DEMAND_DISPLAY = {
  high: { label: 'High', color: 'text-[#1C3829]', bg: 'bg-emerald-50', bar: 80 },
  medium: { label: 'Moderate', color: 'text-amber-600', bg: 'bg-amber-50', bar: 50 },
  low: { label: 'Low', color: 'text-sky-600', bg: 'bg-sky-50', bar: 25 },
} as const

const POSITION_DISPLAY = {
  above_market: { label: 'Above area median', icon: 'up' as const, cls: 'text-amber-600' },
  at_market: { label: 'In line with area', icon: 'flat' as const, cls: 'text-[#1C3829]' },
  below_market: { label: 'Below area median', icon: 'down' as const, cls: 'text-emerald-600' },
}

export default function MarketContext({ property, data }: MarketContextProps) {
  const demandKey = data?.demandLevel ?? null
  const dc = demandKey ? DEMAND_DISPLAY[demandKey] : DEMAND_DISPLAY.medium

  const pricePerSqft =
    data?.pricePerSqft ?? property.pricePerSqft ??
    (property.sqft > 0 ? Math.round(property.price / property.sqft) : null)
  const daysOnMarket = data?.daysOnMarket ?? property.daysOnMarket

  const pos = data?.pricePosition ? POSITION_DISPLAY[data.pricePosition] : null

  const stats = [
    {
      icon: <Clock size={16} className="text-[#6B6B6B]" />,
      label: 'Days on Market',
      value: daysOnMarket != null ? String(daysOnMarket) : '—',
      sub: data?.medianDaysOnMarket != null ? `area median: ${data.medianDaysOnMarket}d` : 'this listing',
    },
    {
      icon: <DollarSign size={16} className="text-[#6B6B6B]" />,
      label: 'Price / sqft',
      value: pricePerSqft != null ? `$${pricePerSqft.toLocaleString()}` : '—',
      sub: data?.medianPricePerSqft != null ? `area median: $${data.medianPricePerSqft.toLocaleString()}` : 'this listing',
    },
    {
      icon:
        pos?.icon === 'up' ? <TrendingUp size={16} className="text-amber-600" />
        : pos?.icon === 'down' ? <TrendingDown size={16} className="text-emerald-600" />
        : <Minus size={16} className="text-[#6B6B6B]" />,
      label: 'Price Position',
      value: pos?.label ?? '—',
      sub: data?.medianPrice != null ? `area median: $${data.medianPrice.toLocaleString()}` : 'vs. active listings',
      valueClass: pos?.cls,
      valueSize: 'text-base',
    },
    {
      icon: <BarChart3 size={16} className={dc.color} />,
      label: 'Demand',
      value: demandKey ? dc.label : '—',
      sub: data ? `${data.totalActiveListingsInCity} active in ${property.city}` : 'buyer competition',
      valueClass: dc.color,
      bg: dc.bg,
    },
  ]

  return (
    <section>
      <div className="flex items-baseline justify-between mb-4">
        <h2 className="font-heading text-xl font-semibold text-[#111111]">
          Market Context
        </h2>
        <span className="text-xs text-[#6B6B6B]">{property.city} · {new Date().toLocaleDateString('en-CA', { month: 'long', year: 'numeric' })}</span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map((s) => (
          <div
            key={s.label}
            className={[
              'bg-white rounded-2xl border border-[#E8E6E1] shadow-sm p-5',
              s.bg ?? '',
            ].join(' ')}
          >
            <div className="flex items-center gap-2 mb-3">
              {s.icon}
              <span className="text-xs text-[#6B6B6B] font-medium">{s.label}</span>
            </div>
            <p className={['font-heading font-bold', s.valueSize ?? 'text-2xl', s.valueClass ?? 'text-[#111111]'].join(' ')}>
              {s.value}
            </p>
            <p className="text-[10px] text-[#6B6B6B] mt-1">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* ── Demand bar ──────────────────────────────────────────────────── */}
      <div className="mt-4 bg-white rounded-2xl border border-[#E8E6E1] shadow-sm p-5">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Activity size={14} className="text-[#6B6B6B]" />
            <span className="text-xs font-medium text-[#6B6B6B]">Buyer Competition Index</span>
          </div>
          <span className={['text-xs font-bold', dc.color].join(' ')}>{demandKey ? dc.label : 'N/A'}</span>
        </div>
        <div className="h-2 bg-[#F2F0EB] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#1C3829] rounded-full transition-all duration-700"
            style={{ width: `${demandKey ? dc.bar : 0}%` }}
          />
        </div>
        <p className="text-[10px] text-[#6B6B6B] mt-2 leading-relaxed">
          {demandKey === 'high'
            ? `Listings here move faster than the area median${data?.medianDaysOnMarket != null ? ` of ${data.medianDaysOnMarket} days` : ''} — expect competition.`
            : demandKey === 'medium'
            ? 'Balanced market with room for negotiation.'
            : demandKey === 'low'
            ? 'Buyer-friendly market with extended negotiation windows.'
            : 'Not enough comparable listings to gauge demand.'}
        </p>
      </div>
    </section>
  )
}
