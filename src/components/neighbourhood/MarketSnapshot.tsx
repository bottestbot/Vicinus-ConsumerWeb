// NBHD-12 — Market snapshot strip. Four stats (2×2 on mobile) with a forest-green
// top-border accent: median price, 30-day price change (coloured), days on market,
// active listings.
import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
import { formatNumber, formatPriceCompact } from '@/lib/format'
import type { NeighbourhoodDetailResponse } from '@/types/neighbourhood-detail'

interface Props {
  marketSnapshot: NeighbourhoodDetailResponse['marketSnapshot']
}

function PriceChange({ value }: { value: number }) {
  const tone =
    value > 0 ? 'text-[#1C7A3F]' : value < 0 ? 'text-[#C0392B]' : 'text-[#6B6B6B]'
  const Icon = value > 0 ? ArrowUpRight : value < 0 ? ArrowDownRight : null
  const sign = value > 0 ? '+' : ''
  return (
    <span className={`inline-flex items-center gap-0.5 ${tone}`}>
      {Icon && <Icon size={20} strokeWidth={2.5} />}
      {sign}
      {value.toFixed(1)}%
    </span>
  )
}

export default function MarketSnapshot({ marketSnapshot }: Props) {
  const { medianPrice, priceChange30d, daysOnMarket, activeListings } = marketSnapshot

  const stats: { label: string; value: React.ReactNode }[] = [
    { label: 'Median Price', value: formatPriceCompact(medianPrice) },
    { label: '30-Day Change', value: <PriceChange value={priceChange30d} /> },
    { label: 'Days on Market', value: daysOnMarket > 0 ? formatNumber(daysOnMarket) : '—' },
    { label: 'Active Listings', value: formatNumber(activeListings) },
  ]

  return (
    <section className="rounded-2xl border-t-4 border-t-[#1C3829] bg-white p-6 shadow-sm ring-1 ring-[#E8E6E1] sm:p-8">
      <p className="mb-6 text-[11px] font-semibold uppercase tracking-widest text-[#1C3829]">
        Market Snapshot
      </p>
      <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label}>
            <p className="font-heading text-2xl font-semibold text-[#111111] sm:text-3xl">
              {stat.value}
            </p>
            <p className="mt-1 text-xs font-medium uppercase tracking-wide text-[#6B6B6B]">
              {stat.label}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}
