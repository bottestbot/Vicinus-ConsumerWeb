'use client'

// Standalone "Price" pill + popover, split out of the combined FiltersDropdown.
// Uses local "draft" state + explicit Clear/Apply so dragging the slider
// doesn't re-trigger a results query on every tick — only Apply commits to
// the store.
//
// The slider runs in *index space* over a non-linear ladder (see
// lib/priceSteps.ts), not raw dollars — a linear $0–10M track spends most of
// its width on prices almost nothing lists at.

import { useRef, useState } from 'react'
import { Slider } from '@base-ui/react/slider'
import { useSearchStore } from '@/store/searchStore'
import { track } from '@/lib/analytics/capture'
import type { ListingType } from '@/types/search'
import { glass, PILL_ACTIVE, type GlassTheme } from './glassTheme'
import ResponsivePopover from './ResponsivePopover'
import { formatPrice } from '@/lib/format'
import { stopsFor, nearestIndex, formatPriceRange } from '@/lib/priceSteps'

/** Digits only — lets a user paste "$1,250,000" and get 1250000. */
function parseAmount(raw: string): number | null {
  const digits = raw.replace(/[^\d]/g, '')
  if (!digits) return null
  const n = Number(digits)
  return Number.isFinite(n) ? n : null
}

export default function PriceFilterPopover({
  theme,
  listingType,
}: {
  theme: GlassTheme
  /** From the route (/buy vs /rent) — selects the rent vs sale price ladder. */
  listingType: ListingType
}) {
  const { filters, setFilter } = useSearchStore()
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)
  const t = glass(theme)

  const isRent = listingType === 'For Rent'
  const stops = stopsFor(isRent)
  const lastIndex = stops.length - 1

  // null = unbounded ("No Min" / "No Max"), which is distinct from 0 / the
  // ceiling: it leaves that side of the filter off rather than pinning it to
  // an extreme.
  const [draftMin, setDraftMin] = useState<number | null>(filters.minPrice)
  const [draftMax, setDraftMax] = useState<number | null>(filters.maxPrice)

  const openPopover = () => {
    setDraftMin(filters.minPrice)
    setDraftMax(filters.maxPrice)
    setOpen(true)
  }

  const hasValue = filters.minPrice !== null || filters.maxPrice !== null
  const summary = formatPriceRange(filters.minPrice, filters.maxPrice, isRent)

  // Unbounded ends sit at the track extremes, so a fresh popover would render a
  // fully-filled bar that reads as an already-active filter. Mute the indicator
  // until at least one bound is actually set.
  const isBounded = draftMin !== null || draftMax !== null
  const minIndex = draftMin === null ? 0 : nearestIndex(stops, draftMin)
  const maxIndex = draftMax === null ? lastIndex : nearestIndex(stops, draftMax)

  const apply = () => {
    // Forgiving rather than strict: a user who types the bounds backwards gets
    // the range they meant instead of a silently empty result set.
    let [min, max] = [draftMin, draftMax]
    if (min !== null && max !== null && min > max) [min, max] = [max, min]
    setFilter('minPrice', min)
    setFilter('maxPrice', max)
    track('filter_applied', { filter_name: 'price', filter_value: { min, max } })
    setOpen(false)
  }

  const clear = () => {
    setDraftMin(null)
    setDraftMax(null)
    setFilter('minPrice', null)
    setFilter('maxPrice', null)
    setOpen(false)
  }

  const inputClass = `w-full rounded-lg px-2.5 py-2 text-sm ${t.input}`

  return (
    <div ref={wrapRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => (open ? setOpen(false) : openPopover())}
        aria-expanded={open}
        aria-label={isRent ? 'Monthly rent range' : 'Price range'}
        className={[
          'inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full text-xs font-medium border transition-colors whitespace-nowrap',
          hasValue ? PILL_ACTIVE : t.chipIdle,
        ].join(' ')}
      >
        {summary ?? 'Price'}
      </button>

      <ResponsivePopover
        open={open}
        onClose={() => setOpen(false)}
        theme={theme}
        anchorRef={wrapRef}
        desktopClassName="w-[340px]"
      >
        <div className="p-4 space-y-5">
          <p className={`text-xs font-semibold ${t.textFaint} uppercase tracking-widest`}>
            {isRent ? 'Monthly rent' : 'Price range'}
          </p>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className={`block text-[11px] mb-1 ${t.textMuted}`}>Minimum</span>
              {/* text + inputMode rather than type="number": a number input can
                  only render bare digits, never "$150,000". */}
              <input
                type="text"
                inputMode="numeric"
                placeholder="No Min"
                value={draftMin === null ? '' : formatPrice(draftMin)}
                onChange={(e) => setDraftMin(parseAmount(e.target.value))}
                className={inputClass}
              />
            </label>
            <label className="block">
              <span className={`block text-[11px] mb-1 ${t.textMuted}`}>Maximum</span>
              <input
                type="text"
                inputMode="numeric"
                placeholder="No Max"
                value={draftMax === null ? '' : formatPrice(draftMax)}
                onChange={(e) => setDraftMax(parseAmount(e.target.value))}
                className={inputClass}
              />
            </label>
          </div>

          <Slider.Root
            value={[minIndex, maxIndex]}
            onValueChange={(v) => {
              const [i0, i1] = v as number[]
              setDraftMin(i0 === 0 ? null : stops[i0])
              setDraftMax(i1 === lastIndex ? null : stops[i1])
            }}
            min={0}
            max={lastIndex}
            step={1}
            minStepsBetweenValues={1}
          >
            <Slider.Control className="relative flex items-center h-6">
              <Slider.Track className="h-1 w-full rounded-full bg-black/10">
                <Slider.Indicator
                  className={`h-full rounded-full ${isBounded ? 'bg-[#1C3829]' : 'bg-transparent'}`}
                />
                <Slider.Thumb
                  className="block w-4 h-4 rounded-full bg-[#1C3829] border-2 border-white shadow"
                  index={0}
                />
                <Slider.Thumb
                  className="block w-4 h-4 rounded-full bg-[#1C3829] border-2 border-white shadow"
                  index={1}
                />
              </Slider.Track>
            </Slider.Control>
          </Slider.Root>

          {/* Scale ends, not the current values — the inputs above already show
              those, and they update live while dragging. The top stop is
              labelled "No Max" rather than the ceiling amount: dragging there
              clears the bound entirely, so listings above it still match. */}
          <div className={`flex justify-between text-[11px] ${t.textFaint}`}>
            <span>{formatPrice(0)}</span>
            <span>No Max</span>
          </div>

          <div className="flex items-center justify-end gap-4 pt-1">
            <button
              type="button"
              onClick={clear}
              className={`text-xs font-semibold uppercase tracking-wide ${t.textMuted}`}
            >
              Clear
            </button>
            <button
              type="button"
              onClick={apply}
              className="px-5 py-2 rounded-full text-xs font-semibold bg-[#1C3829] text-white hover:bg-[#2D5A3D] transition-colors"
            >
              Apply
            </button>
          </div>
        </div>
      </ResponsivePopover>
    </div>
  )
}
