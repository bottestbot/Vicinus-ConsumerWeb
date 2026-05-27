// FE-407: MarketContext — days on market, trend, demand level
import { TrendingUp, TrendingDown, Activity, Clock, DollarSign, BarChart3 } from 'lucide-react'
import type { PropertyDetail } from '@/types/property'

interface MarketContextProps {
  property: PropertyDetail
}

export default function MarketContext({ property }: MarketContextProps) {
  const demandLevel = property.demandLevel ?? 'Moderate'
  const pricePerSqft = property.pricePerSqft ?? Math.round(property.price / property.sqft)
  const priceChange = property.priceChange ?? 8.4

  const demandConfig = {
    Low: { color: 'text-sky-600', bg: 'bg-sky-50', bar: 25 },
    Moderate: { color: 'text-amber-600', bg: 'bg-amber-50', bar: 50 },
    High: { color: 'text-[#1C3829]', bg: 'bg-emerald-50', bar: 75 },
    'Very High': { color: 'text-red-600', bg: 'bg-red-50', bar: 100 },
  }

  const dc = demandConfig[demandLevel]

  const stats = [
    {
      icon: <Clock size={16} className="text-[#6B6B6B]" />,
      label: 'Days on Market',
      value: String(property.daysOnMarket),
      sub: 'avg for area: 18d',
    },
    {
      icon: <DollarSign size={16} className="text-[#6B6B6B]" />,
      label: 'Price / sqft',
      value: `$${pricePerSqft.toLocaleString()}`,
      sub: 'neighbourhood avg: $1,290',
    },
    {
      icon: priceChange >= 0
        ? <TrendingUp size={16} className="text-emerald-600" />
        : <TrendingDown size={16} className="text-red-500" />,
      label: 'YoY Change',
      value: `${priceChange >= 0 ? '+' : ''}${priceChange.toFixed(1)}%`,
      sub: 'year over year',
      valueClass: priceChange >= 0 ? 'text-emerald-600' : 'text-red-500',
    },
    {
      icon: <BarChart3 size={16} className={dc.color} />,
      label: 'Demand',
      value: demandLevel,
      sub: 'buyer competition',
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
            <p className={['font-heading text-2xl font-bold', s.valueClass ?? 'text-[#111111]'].join(' ')}>
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
          <span className={['text-xs font-bold', dc.color].join(' ')}>{demandLevel}</span>
        </div>
        <div className="h-2 bg-[#F2F0EB] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#1C3829] rounded-full transition-all duration-700"
            style={{ width: `${dc.bar}%` }}
          />
        </div>
        <p className="text-[10px] text-[#6B6B6B] mt-2 leading-relaxed">
          {demandLevel === 'Very High'
            ? 'Expect multiple offers above asking price. Move quickly.'
            : demandLevel === 'High'
            ? 'Competitive market with fast-moving listings. Offers often near asking.'
            : demandLevel === 'Moderate'
            ? 'Balanced market with room for negotiation.'
            : 'Buyer-friendly market with extended negotiation windows.'}
        </p>
      </div>
    </section>
  )
}
