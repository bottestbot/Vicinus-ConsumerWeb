'use client'

// Standalone "Price" pill + popover, split out of the combined FiltersDropdown.
// Uses local "draft" state + explicit Clear/Apply so dragging the slider
// doesn't re-trigger a results query on every tick — only Apply commits to
// the store.

import { useState } from 'react'
import { Slider } from '@base-ui/react/slider'
import { useSearchStore } from '@/store/searchStore'
import { glass, PILL_ACTIVE, type GlassTheme } from './glassTheme'
import ResponsivePopover from './ResponsivePopover'
import { formatNumber } from '@/lib/format'

const ABSOLUTE_MIN = 0
const ABSOLUTE_MAX = 10_000_000
const STEP = 25_000

export default function PriceFilterPopover({ theme }: { theme: GlassTheme }) {
  const { filters, setFilter } = useSearchStore()
  const [open, setOpen] = useState(false)
  const t = glass(theme)

  const [draftMin, setDraftMin] = useState(filters.minPrice ?? ABSOLUTE_MIN)
  const [draftMax, setDraftMax] = useState(filters.maxPrice ?? ABSOLUTE_MAX)

  const openPopover = () => {
    setDraftMin(filters.minPrice ?? ABSOLUTE_MIN)
    setDraftMax(filters.maxPrice ?? ABSOLUTE_MAX)
    setOpen(true)
  }

  const hasValue = filters.minPrice !== null || filters.maxPrice !== null

  const apply = () => {
    setFilter('minPrice', draftMin <= ABSOLUTE_MIN ? null : draftMin)
    setFilter('maxPrice', draftMax >= ABSOLUTE_MAX ? null : draftMax)
    setOpen(false)
  }
  const clear = () => {
    setDraftMin(ABSOLUTE_MIN)
    setDraftMax(ABSOLUTE_MAX)
    setFilter('minPrice', null)
    setFilter('maxPrice', null)
    setOpen(false)
  }

  return (
    <div className="relative shrink-0">
      <button
        onClick={() => (open ? setOpen(false) : openPopover())}
        aria-expanded={open}
        className={[
          'inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full text-xs font-medium border transition-colors whitespace-nowrap',
          hasValue ? PILL_ACTIVE : t.chipIdle,
        ].join(' ')}
      >
        Price
      </button>

      <ResponsivePopover open={open} onClose={() => setOpen(false)} theme={theme} desktopClassName="w-[340px]">
        <div className="p-4 space-y-5">
          <p className={`text-xs font-semibold ${t.textFaint} uppercase tracking-widest`}>Price range</p>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className={`block text-[11px] mb-1 ${t.textMuted}`}>Minimum</span>
              <input
                type="number"
                min={ABSOLUTE_MIN}
                max={draftMax}
                step={STEP}
                value={draftMin}
                onChange={(e) => setDraftMin(Math.min(Number(e.target.value) || ABSOLUTE_MIN, draftMax))}
                className={`w-full rounded-lg px-2.5 py-2 text-sm ${t.input}`}
              />
            </label>
            <label className="block">
              <span className={`block text-[11px] mb-1 ${t.textMuted}`}>Maximum</span>
              <input
                type="number"
                min={draftMin}
                max={ABSOLUTE_MAX}
                step={STEP}
                value={draftMax}
                onChange={(e) => setDraftMax(Math.max(Number(e.target.value) || ABSOLUTE_MAX, draftMin))}
                className={`w-full rounded-lg px-2.5 py-2 text-sm ${t.input}`}
              />
            </label>
          </div>

          <Slider.Root
            value={[draftMin, draftMax]}
            onValueChange={(v) => {
              setDraftMin(v[0])
              setDraftMax(v[1])
            }}
            min={ABSOLUTE_MIN}
            max={ABSOLUTE_MAX}
            step={STEP}
            minStepsBetweenValues={1}
          >
            <Slider.Control className="relative flex items-center h-6">
              <Slider.Track className="h-1 w-full rounded-full bg-black/10">
                <Slider.Indicator className="h-full rounded-full bg-[#1C3829]" />
                <Slider.Thumb className="block w-4 h-4 rounded-full bg-[#1C3829] border-2 border-white shadow" index={0} />
                <Slider.Thumb className="block w-4 h-4 rounded-full bg-[#1C3829] border-2 border-white shadow" index={1} />
              </Slider.Track>
            </Slider.Control>
          </Slider.Root>

          <div className={`flex justify-between text-[11px] ${t.textFaint}`}>
            <span>{formatNumber(draftMin)}</span>
            <span>{draftMax >= ABSOLUTE_MAX ? `${formatNumber(ABSOLUTE_MAX)}+` : formatNumber(draftMax)}</span>
          </div>

          <div className="flex items-center justify-end gap-4 pt-1">
            <button onClick={clear} className={`text-xs font-semibold uppercase tracking-wide ${t.textMuted}`}>
              Clear
            </button>
            <button
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
