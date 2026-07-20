'use client'

// NBHD-11 — Livability score panel. Forest-green card with a lime SVG progress
// ring for the composite score, a percentile blurb, and four weighted sub-score
// bars (each with a tooltip explaining its weight). Bars + ring animate on mount
// unless the visitor prefers reduced motion.
import { useEffect, useState, useSyncExternalStore } from 'react'
import type { NeighbourhoodDetailResponse } from '@/types/neighbourhood-detail'

interface Props {
  livability: NeighbourhoodDetailResponse['livability']
  city: string
}

const RING_SIZE = 168
const RING_STROKE = 12
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS

// Order + weights mirror the deterministic backend blend
// (Walk 0.30 · Schools 0.25 · Amenities 0.25 · Transit 0.20). Healthcare is
// intentionally excluded from livability (proximity ≠ access).
const BARS = [
  { key: 'walkability', label: 'Walkability', weight: 0.3 },
  { key: 'schools', label: 'Schools', weight: 0.25 },
  { key: 'amenities', label: 'Amenities', weight: 0.25 },
  { key: 'transit', label: 'Transit', weight: 0.2 },
] as const

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'

function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const mq = window.matchMedia(REDUCED_MOTION_QUERY)
      mq.addEventListener('change', onChange)
      return () => mq.removeEventListener('change', onChange)
    },
    () => window.matchMedia(REDUCED_MOTION_QUERY).matches,
    () => false, // server snapshot — assume motion allowed until hydrated
  )
}

export default function LivabilityPanel({ livability, city }: Props) {
  const reducedMotion = usePrefersReducedMotion()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // Defer to the next frame so the transition animates from 0 → value.
    const id = requestAnimationFrame(() => setMounted(true))
    return () => cancelAnimationFrame(id)
  }, [])

  const animate = mounted || reducedMotion
  const { score, percentile, breakdown } = livability
  const ringOffset = RING_CIRCUMFERENCE * (1 - (animate ? score : 0) / 100)

  return (
    <section className="rounded-2xl bg-[#1C3829] p-6 text-white sm:p-8">
      <p className="mb-6 text-[11px] font-semibold uppercase tracking-widest text-[#A3E635]">
        Livability
      </p>

      <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:gap-8">
        {/* Progress ring */}
        <div className="relative shrink-0" style={{ width: RING_SIZE, height: RING_SIZE }}>
          <svg width={RING_SIZE} height={RING_SIZE} className="-rotate-90">
            <circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RING_RADIUS}
              fill="none"
              stroke="#FAF9F6"
              strokeOpacity={0.15}
              strokeWidth={RING_STROKE}
            />
            <circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RING_RADIUS}
              fill="none"
              stroke="#A3E635"
              strokeWidth={RING_STROKE}
              strokeLinecap="round"
              strokeDasharray={RING_CIRCUMFERENCE}
              strokeDashoffset={ringOffset}
              style={{
                transition: reducedMotion ? 'none' : 'stroke-dashoffset 900ms ease-out',
              }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-heading text-5xl font-semibold leading-none">{score}</span>
            <span className="mt-1 text-[11px] uppercase tracking-widest text-white/70">
              Livability Score
            </span>
          </div>
        </div>

        {/* Percentile + bars */}
        <div className="w-full">
          <p className="mb-5 text-sm text-white/80">
            Better than <span className="font-semibold text-[#A3E635]">{percentile}%</span> of
            neighbourhoods{city ? ` in ${city}` : ''}
          </p>

          <div className="space-y-3.5">
            {BARS.map((bar) => {
              const raw = breakdown[bar.key]
              const value = raw ?? 0
              const isNa = raw == null
              const weightPct = Math.round(bar.weight * 100)
              return (
                <div key={bar.key} className="group relative">
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="font-medium text-white/85">{bar.label}</span>
                    <span className="tabular-nums text-white/70">{isNa ? 'N/A' : value}</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-white/12">
                    <div
                      className="h-full rounded-full bg-[#A3E635]"
                      style={{
                        width: `${animate && !isNa ? value : 0}%`,
                        transition: reducedMotion ? 'none' : 'width 900ms ease-out',
                      }}
                    />
                  </div>
                  {/* Weight tooltip */}
                  <div
                    role="tooltip"
                    className="pointer-events-none absolute -top-9 left-0 z-10 whitespace-nowrap rounded-md bg-[#0F231A] px-2.5 py-1 text-[11px] text-white opacity-0 shadow-lg ring-1 ring-white/10 transition-opacity duration-150 group-hover:opacity-100"
                  >
                    Weighted {weightPct}% of the livability score
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
