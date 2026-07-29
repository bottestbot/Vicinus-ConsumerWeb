'use client'

// NBHD-D07 — Area scores panel. Forest-green panel with four labelled sub-score
// bars (Walkability · Schools access · Amenities · Transit). Bars animate on
// mount unless the visitor prefers reduced motion.
//
// The blended Livability score and its "Top X% in {region}" percentile are
// deliberately not surfaced here — the composite is still held back, so only the
// four measured dimensions are shown.
import { useEffect, useState, useSyncExternalStore } from 'react'
import type { NeighbourhoodDetailResponse } from '@/types/neighbourhood-detail'

interface Props {
  livability: NeighbourhoodDetailResponse['livability']
}

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

export default function LivabilityPanel({ livability }: Props) {
  const reducedMotion = usePrefersReducedMotion()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true))
    return () => cancelAnimationFrame(id)
  }, [])

  const animate = mounted || reducedMotion
  const { breakdown } = livability

  return (
    <section className="rounded-2xl bg-[#1C3829] p-6 text-white sm:p-8">
      <h2 className="font-heading text-xl font-semibold leading-snug text-white">
        How this area scores
      </h2>

      <div className="mt-6 grid gap-x-10 gap-y-3.5 sm:grid-cols-2">
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
    </section>
  )
}
