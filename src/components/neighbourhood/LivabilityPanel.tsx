'use client'

// NBHD-D07 — Livability panel. Forest-green panel: a big lime score with the
// "Top X% in {city}" percentile on the left, and four labelled sub-score bars on
// the right (Walkability · Schools access · Amenities · Transit). Bars animate on
// mount unless the visitor prefers reduced motion.
import { useEffect, useState, useSyncExternalStore } from 'react'
import type { NeighbourhoodDetailResponse } from '@/types/neighbourhood-detail'

interface Props {
  livability: NeighbourhoodDetailResponse['livability']
  city: string
}

// Order + weights mirror the deterministic backend blend
// (Walk 0.30 · Schools 0.25 · Amenities 0.25 · Transit 0.20).
const BARS = [
  { key: 'walkability', label: 'Walkability' },
  { key: 'schools', label: 'Schools access' },
  { key: 'amenities', label: 'Amenities' },
  { key: 'transit', label: 'Transit' },
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
    () => false,
  )
}

export default function LivabilityPanel({ livability, city }: Props) {
  const reducedMotion = usePrefersReducedMotion()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true))
    return () => cancelAnimationFrame(id)
  }, [])

  const animate = mounted || reducedMotion
  const { score, percentile, breakdown, region } = livability
  const topPercent = Math.max(1, 100 - percentile)
  // 0 is the API's stand-in for "no score computed yet" (batch not run).
  const isScored = score > 0

  return (
    <section className="rounded-2xl bg-[#1C3829] p-6 text-white sm:p-8">
      <div className="grid gap-8 sm:grid-cols-[minmax(140px,1fr)_2fr] sm:items-center">
        {/* Score. A score of 0 means "not yet computed", not "scores zero" —
            the API coerces an unscored neighbourhood to 0 to satisfy the
            numeric contract, so rendering a bare 0 would assert a rating we
            never calculated. */}
        <div>
          {isScored ? (
            <p className="font-heading text-6xl font-semibold leading-none text-[#A3E635]">{score}</p>
          ) : (
            <p className="font-heading text-3xl font-semibold leading-tight text-white/50">
              Not yet rated
            </p>
          )}
          <p className="mt-2 text-sm font-medium text-white">Livability</p>
          {isScored && percentile > 0 && (
            <p className="text-xs text-white/70">
              Top {topPercent}%{region ?? city ? ` in ${region ?? city}` : ''}
            </p>
          )}
        </div>

        {/* Sub-score bars */}
        <div className="space-y-3.5">
          {BARS.map((bar) => {
            const raw = breakdown[bar.key]
            const value = raw ?? 0
            const isNa = raw == null
            return (
              <div key={bar.key}>
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
              </div>
            )
          })}
        </div>
      </div>

      <div className="mt-6 border-t border-white/10 pt-4">
        <a
          href="/methodology/livability"
          className="text-xs font-medium text-[#A3E635] underline-offset-2 hover:underline"
        >
          How we calculate this
        </a>
      </div>
    </section>
  )
}
