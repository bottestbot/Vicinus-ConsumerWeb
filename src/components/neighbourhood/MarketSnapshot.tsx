// NBHD-D02 — Market snapshot panel (lives inside the hero's right panel).
// Four stats: Median Price (+ trend), Walk Score, Transit, Days on Market.
import { TrendingDown, TrendingUp } from 'lucide-react'
import { formatPriceCompact } from '@/lib/format'
import type { NeighbourhoodDetailResponse } from '@/types/neighbourhood-detail'

interface Props {
  marketSnapshot: NeighbourhoodDetailResponse['marketSnapshot']
  walkScore: number | null
  transitScore: number | null
}

function Stat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-[#6B6B6B]">{label}</p>
      <p className="font-heading text-2xl font-semibold leading-none text-[#111111]">{children}</p>
    </div>
  )
}

function scoreLabel(v: number | null): string {
  return v != null && v > 0 ? String(v) : '—'
}

export default function MarketSnapshot({ marketSnapshot, walkScore, transitScore }: Props) {
  const { medianPrice, priceChange30d, daysOnMarket } = marketSnapshot
  const trendUp = priceChange30d > 0
  const trendDown = priceChange30d < 0
  const TrendIcon = trendUp ? TrendingUp : trendDown ? TrendingDown : null
  const trendTone = trendUp ? 'text-[#1C7A3F]' : trendDown ? 'text-[#C0392B]' : 'text-[#6B6B6B]'

  return (
    <div>
      <p className="mb-4 text-[11px] font-semibold uppercase tracking-widest text-[#1C3829]">
        Market Snapshot
      </p>
      <div className="grid grid-cols-2 gap-x-4 gap-y-5">
        <Stat label="Median Price">
          {formatPriceCompact(medianPrice)}
          {priceChange30d !== 0 && (
            <span className={`ml-1.5 inline-flex items-center gap-0.5 text-xs font-semibold ${trendTone}`}>
              {TrendIcon && <TrendIcon size={13} strokeWidth={2.5} />}
              {trendUp ? '+' : ''}
              {priceChange30d.toFixed(1)}%
            </span>
          )}
        </Stat>
        <Stat label="Walk Score">{scoreLabel(walkScore)}</Stat>
        <Stat label="Transit">{scoreLabel(transitScore)}</Stat>
        <Stat label="Days on Market">{daysOnMarket > 0 ? daysOnMarket : '—'}</Stat>
      </div>
    </div>
  )
}
