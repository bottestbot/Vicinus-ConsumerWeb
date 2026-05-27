'use client'

// FE-404: NeighbourhoodContextScore — walk score, lifestyle score + mini map
import dynamic from 'next/dynamic'
import type { PropertyDetail } from '@/types/property'

// Dynamically import map to avoid SSR
const NeighbourhoodMiniMap = dynamic(() => import('./NeighbourhoodMiniMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-[#E8E6E1] animate-pulse rounded-xl flex items-center justify-center">
      <span className="text-[#6B6B6B] text-xs">Loading map…</span>
    </div>
  ),
})

interface NeighbourhoodContextScoreProps {
  property: PropertyDetail
}

export default function NeighbourhoodContextScore({ property }: NeighbourhoodContextScoreProps) {
  const neighbourhood = property.neighbourhood ?? property.city
  const walkScore = property.walkScore ?? 80
  const lifestyleScore = property.lifestyleScore ?? 8
  const lifestyleLabel = property.lifestyleLabel ?? 'Very Walkable'

  return (
    <section>
      <div className="flex items-baseline justify-between mb-4">
        <h2 className="font-heading text-xl font-semibold text-[#111111]">
          {neighbourhood} Context
        </h2>
        <a
          href="#"
          className="text-xs text-[#1C3829] hover:underline font-medium"
        >
          View full profile →
        </a>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* ── Left: mini map ─────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-[#E8E6E1] shadow-sm overflow-hidden h-56">
          <NeighbourhoodMiniMap
            latitude={property.latitude}
            longitude={property.longitude}
            address={property.address}
          />
        </div>

        {/* ── Right: scores ─────────────────────────────────────────────── */}
        <div className="flex flex-col gap-3">
          {/* Walk Score */}
          <div className="flex-1 bg-white rounded-2xl border border-[#E8E6E1] shadow-sm p-5 flex items-center gap-5">
            <div className="shrink-0">
              <p className="font-heading text-5xl font-bold text-[#111111] leading-none">
                {walkScore}
              </p>
              <p className="text-[11px] text-[#6B6B6B] mt-1 font-medium uppercase tracking-wide">
                Walk Score®
              </p>
            </div>
            <div className="flex-1">
              {/* Score bar */}
              <div className="h-1.5 bg-[#F2F0EB] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#1C3829] rounded-full transition-all duration-700"
                  style={{ width: `${walkScore}%` }}
                />
              </div>
              <p className="text-xs text-[#6B6B6B] mt-2 leading-relaxed">
                {walkScore >= 90
                  ? "Walker's Paradise — daily errands do not require a car."
                  : walkScore >= 70
                  ? 'Very Walkable — most errands can be accomplished on foot.'
                  : 'Somewhat Walkable — some errands can be accomplished on foot.'}
              </p>
            </div>
          </div>

          {/* Lifestyle Score */}
          <div className="flex-1 bg-white rounded-2xl border border-[#E8E6E1] shadow-sm p-5 flex items-center gap-5">
            <div className="shrink-0">
              <p className="font-heading text-5xl font-bold text-[#111111] leading-none">
                {lifestyleScore}
                <span className="text-2xl text-[#6B6B6B] font-normal">/10</span>
              </p>
              <p className="text-[11px] text-[#6B6B6B] mt-1 font-medium uppercase tracking-wide">
                Lifestyle Score
              </p>
            </div>
            <div className="flex-1">
              {/* Dot rating */}
              <div className="flex gap-1">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div
                    key={i}
                    className={[
                      'h-1.5 flex-1 rounded-full transition-all',
                      i < lifestyleScore ? 'bg-[#1C3829]' : 'bg-[#E8E6E1]',
                    ].join(' ')}
                  />
                ))}
              </div>
              <p className="text-xs text-[#6B6B6B] mt-2">{lifestyleLabel}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
