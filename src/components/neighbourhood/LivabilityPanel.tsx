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

// `zeroNote` qualifies a score of 0, `nullNote` qualifies a missing sub-score.
//
// N-05 — the API sends `0` for schools both when the snapshot held no school
// POIs at all and when every school sat beyond the 3km decay radius
// (`schools-amenities.service.ts` returns 0 from either branch). Nothing in the
// payload separates the two, so the panel must not pretend to: rendering "N/A"
// would assert "unmeasured" for a value that is often a genuine measurement.
// Both branches mean the same thing to a reader — no school within walking
// reach of the centroid — so a 0 stays a 0 and is captioned to say so, which
// also stops it reading as a contradiction of the Schools card's empty state.
//
// N-06 — a null transit sub-score means no agency GTFS feed covers the area,
// not "no transit here". Local Essentials can still list a rail station on the
// same screen, so the N/A says which of the two it is.
const BARS = [
  {
    key: 'walkability',
    label: 'Walkability',
    zeroNote: 'nothing walkable nearby',
    nullNote: 'not measured',
  },
  {
    key: 'schools',
    label: 'Schools access',
    zeroNote: 'none within walking distance',
    nullNote: 'not measured',
  },
  {
    key: 'amenities',
    label: 'Amenities',
    zeroNote: 'none within walking distance',
    nullNote: 'not measured',
  },
  {
    key: 'transit',
    label: 'Transit',
    zeroNote: 'no stops within walking distance',
    nullNote: 'no schedule data',
  },
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
          const isNa = raw == null
          // N-07 — sub-scores arrive with one decimal; a score is conventionally
          // an integer. Round once and drive both the label and the bar from it
          // so the two can never disagree.
          const value = isNa ? 0 : Math.round(raw)
          const note = isNa ? bar.nullNote : value === 0 ? bar.zeroNote : null
          return (
            <div key={bar.key}>
              <div className="mb-1 flex items-baseline justify-between gap-3 text-xs">
                <span className="font-medium text-white/85">{bar.label}</span>
                <span className="flex items-baseline gap-1.5 text-white/70">
                  {note && <span className="text-[10px] text-white/55">{note}</span>}
                  <span className="tabular-nums">{isNa ? 'N/A' : value}</span>
                </span>
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
