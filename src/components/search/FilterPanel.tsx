'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown, X, SlidersHorizontal } from 'lucide-react'
import { useSearchStore } from '@/store/searchStore'
import SaveSearch from './SaveSearch'
import SearchBar from './SearchBar'
import ViewToggle from './ViewToggle'

// ─── Popover (generic) ────────────────────────────────────────────────────────

function FilterChip({
  label,
  active,
  onClick,
  onClear,
}: {
  label: string
  active?: boolean
  onClick: () => void
  onClear?: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={[
        'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium',
        'border whitespace-nowrap transition-colors',
        active
          ? 'bg-[#1C3829] text-white border-[#1C3829]'
          : 'bg-white text-[#111111] border-[#E8E6E1] hover:border-[#1C3829]/40',
      ].join(' ')}
    >
      {label}
      {active && onClear ? (
        <X
          size={11}
          className="ml-0.5"
          onClick={(e) => {
            e.stopPropagation()
            onClear()
          }}
        />
      ) : (
        <ChevronDown size={11} />
      )}
    </button>
  )
}

function Popover({
  children,
  isOpen,
  onClose,
}: {
  children: React.ReactNode
  isOpen: boolean
  onClose: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  const markerRef = useRef<HTMLSpanElement>(null)
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null)

  // Anchor the portal to the chip (the marker's parent), so it escapes the
  // filter row's overflow-x-auto clip instead of being cut off.
  const update = useCallback(() => {
    const r = markerRef.current?.parentElement?.getBoundingClientRect()
    if (r) setCoords({ top: r.bottom + 8, left: r.left })
  }, [])

  useEffect(() => {
    if (!isOpen) return
    update()
    const handler = (e: MouseEvent) => {
      const t = e.target as Node
      if (!ref.current?.contains(t) && !markerRef.current?.parentElement?.contains(t)) onClose()
    }
    document.addEventListener('mousedown', handler)
    window.addEventListener('resize', update)
    window.addEventListener('scroll', update, true)
    return () => {
      document.removeEventListener('mousedown', handler)
      window.removeEventListener('resize', update)
      window.removeEventListener('scroll', update, true)
    }
  }, [isOpen, onClose, update])

  return (
    <span ref={markerRef} className="hidden" aria-hidden>
      {isOpen && coords && typeof document !== 'undefined' && createPortal(
        <div
          ref={ref}
          style={{ position: 'fixed', top: coords.top, left: coords.left }}
          className={[
            'bg-white rounded-xl border border-[#E8E6E1]',
            'shadow-xl shadow-black/10 z-[100] min-w-[280px] p-4',
          ].join(' ')}
        >
          {children}
        </div>,
        document.body,
      )}
    </span>
  )
}

// ─── Individual Filter Groups ─────────────────────────────────────────────────

// NOTE: The For Sale / For Rent (Buy/Rent) filter was removed — Vicinus has no
// rental inventory yet (DDF residential is sale-only). `listingType` stays
// pinned to 'For Sale' in the store so the DDF query keeps excluding leases.
// Re-introduce this filter once rental data exists.

function PriceRangeFilter() {
  const { filters, setFilter } = useSearchStore()
  const [open, setOpen] = useState(false)

  const MIN_OPTIONS = [null, 500_000, 1_000_000, 2_000_000, 3_000_000, 5_000_000]
  const MAX_OPTIONS = [null, 1_000_000, 2_000_000, 3_000_000, 5_000_000, 10_000_000]

  const hasValue = filters.minPrice !== null || filters.maxPrice !== null
  const label = hasValue
    ? [
        filters.minPrice ? `$${(filters.minPrice / 1e6).toFixed(1)}M` : 'Any',
        filters.maxPrice ? `$${(filters.maxPrice / 1e6).toFixed(1)}M` : 'Any',
      ].join(' – ')
    : 'Price'

  const fmt = (v: number | null) =>
    v === null ? 'Any' : v >= 1_000_000 ? `$${(v / 1e6).toFixed(1)}M` : `$${(v / 1000).toFixed(0)}K`

  return (
    <div className="relative">
      <FilterChip
        label={label}
        active={hasValue}
        onClick={() => setOpen((v) => !v)}
        onClear={() => { setFilter('minPrice', null); setFilter('maxPrice', null) }}
      />
      <Popover isOpen={open} onClose={() => setOpen(false)}>
        <p className="text-xs font-semibold text-[#6B6B6B] mb-3 uppercase tracking-wide">Price Range</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-[#6B6B6B] mb-1.5 block">Min Price</label>
            <select
              value={filters.minPrice ?? ''}
              onChange={(e) => setFilter('minPrice', e.target.value ? Number(e.target.value) : null)}
              className="w-full text-sm border border-[#E8E6E1] rounded-lg px-2.5 py-2 text-[#111111] focus:outline-none focus:border-[#1C3829]"
            >
              {MIN_OPTIONS.map((v) => (
                <option key={v ?? 'any'} value={v ?? ''}>{fmt(v)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-[#6B6B6B] mb-1.5 block">Max Price</label>
            <select
              value={filters.maxPrice ?? ''}
              onChange={(e) => setFilter('maxPrice', e.target.value ? Number(e.target.value) : null)}
              className="w-full text-sm border border-[#E8E6E1] rounded-lg px-2.5 py-2 text-[#111111] focus:outline-none focus:border-[#1C3829]"
            >
              {MAX_OPTIONS.map((v) => (
                <option key={v ?? 'any'} value={v ?? ''}>{fmt(v)}</option>
              ))}
            </select>
          </div>
        </div>
      </Popover>
    </div>
  )
}

function BedsAndBathsFilter() {
  const { filters, setFilter } = useSearchStore()
  const [open, setOpen] = useState(false)

  const options = [null, 1, 2, 3, 4, 5]
  const hasValue = filters.beds !== null || filters.baths !== null

  const label = hasValue
    ? [
        filters.beds !== null ? `${filters.beds}+ bd` : null,
        filters.baths !== null ? `${filters.baths}+ ba` : null,
      ].filter(Boolean).join(', ') || 'Beds & Baths'
    : 'Beds & Baths'

  return (
    <div className="relative">
      <FilterChip
        label={label}
        active={hasValue}
        onClick={() => setOpen((v) => !v)}
        onClear={() => { setFilter('beds', null); setFilter('baths', null) }}
      />
      <Popover isOpen={open} onClose={() => setOpen(false)}>
        <p className="text-xs font-semibold text-[#6B6B6B] mb-3 uppercase tracking-wide">Beds & Baths</p>
        <div className="space-y-4">
          {(['beds', 'baths'] as const).map((field) => (
            <div key={field}>
              <p className="text-sm font-medium text-[#111111] mb-2 capitalize">{field === 'beds' ? 'Bedrooms' : 'Bathrooms'}</p>
              <div className="flex gap-1.5">
                {options.map((v) => (
                  <button
                    key={v ?? 'any'}
                    onClick={() => setFilter(field, v)}
                    className={[
                      'flex-1 py-1.5 rounded-lg text-xs font-medium border transition-colors',
                      filters[field] === v
                        ? 'bg-[#1C3829] text-white border-[#1C3829]'
                        : 'border-[#E8E6E1] text-[#111111] hover:border-[#1C3829]/40',
                    ].join(' ')}
                  >
                    {v === null ? 'Any' : `${v}+`}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Popover>
    </div>
  )
}

// Friendly home-type labels → real DDF `StructureType` values (verified against
// the live feed). This is the field that actually distinguishes House / Condo /
// Townhouse — `PropertySubType` files them all as "Single Family". A label may
// map to several StructureType values (e.g. mobile homes).
const HOME_TYPES: { label: string; values: string[] }[] = [
  { label: 'House', values: ['House'] },
  { label: 'Condo / Apartment', values: ['Apartment'] },
  { label: 'Townhouse', values: ['Row / Townhouse'] },
  { label: 'Duplex', values: ['Duplex'] },
  { label: 'Multi-Family', values: ['Multi-Family'] },
  { label: 'Mobile / Manufactured', values: ['Mobile Home', 'Manufactured Home', 'Park Model Mobile Home'] },
]

function HomeTypeFilter() {
  const { filters, setFilter } = useSearchStore()
  const [open, setOpen] = useState(false)

  const selected = filters.structureType
  // A label is "on" when all its underlying StructureType values are selected.
  const isOn = (values: string[]) => values.every((v) => selected.includes(v))
  const selectedLabelCount = HOME_TYPES.filter((t) => isOn(t.values)).length
  const hasValue = selected.length > 0

  const toggle = (values: string[]) => {
    const next = isOn(values)
      ? selected.filter((v) => !values.includes(v))
      : [...new Set([...selected, ...values])]
    setFilter('structureType', next)
  }

  return (
    <div className="relative">
      <FilterChip
        label={hasValue ? `Type (${selectedLabelCount})` : 'Home Type'}
        active={hasValue}
        onClick={() => setOpen((v) => !v)}
        onClear={() => setFilter('structureType', [])}
      />
      <Popover isOpen={open} onClose={() => setOpen(false)}>
        <p className="text-xs font-semibold text-[#6B6B6B] mb-3 uppercase tracking-wide">Home Type</p>
        <div className="grid grid-cols-2 gap-2">
          {HOME_TYPES.map((t) => (
            <button
              key={t.label}
              onClick={() => toggle(t.values)}
              className={[
                'py-2 px-3 rounded-lg text-xs font-medium border text-left transition-colors',
                isOn(t.values)
                  ? 'bg-[#1C3829] text-white border-[#1C3829]'
                  : 'border-[#E8E6E1] text-[#111111] hover:border-[#1C3829]/40',
              ].join(' ')}
            >
              {t.label}
            </button>
          ))}
        </div>
      </Popover>
    </div>
  )
}

function SizeFilter() {
  const { filters, setFilter } = useSearchStore()
  const [open, setOpen] = useState(false)

  const opts = [null, 500, 1000, 1500, 2000, 3000, 5000]
  const hasValue = filters.minSqft !== null || filters.maxSqft !== null

  return (
    <div className="relative">
      <FilterChip
        label={hasValue ? 'Size ✓' : 'Size'}
        active={hasValue}
        onClick={() => setOpen((v) => !v)}
        onClear={() => { setFilter('minSqft', null); setFilter('maxSqft', null) }}
      />
      <Popover isOpen={open} onClose={() => setOpen(false)}>
        <p className="text-xs font-semibold text-[#6B6B6B] mb-3 uppercase tracking-wide">Square Footage</p>
        <div className="grid grid-cols-2 gap-3">
          {(['minSqft', 'maxSqft'] as const).map((field) => (
            <div key={field}>
              <label className="text-xs text-[#6B6B6B] mb-1.5 block">{field === 'minSqft' ? 'Min sqft' : 'Max sqft'}</label>
              <select
                value={filters[field] ?? ''}
                onChange={(e) => setFilter(field, e.target.value ? Number(e.target.value) : null)}
                className="w-full text-sm border border-[#E8E6E1] rounded-lg px-2.5 py-2 text-[#111111] focus:outline-none focus:border-[#1C3829]"
              >
                {opts.map((v) => (
                  <option key={v ?? 'any'} value={v ?? ''}>{v === null ? 'Any' : `${v.toLocaleString()} sqft`}</option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </Popover>
    </div>
  )
}

function ToggleRow({
  label,
  value,
  onToggle,
}: {
  label: string
  value: boolean
  onToggle: () => void
}) {
  return (
    <label className="flex items-center justify-between py-1.5 cursor-pointer group">
      <span className="text-sm text-[#111111] group-hover:text-[#1C3829] transition-colors">{label}</span>
      <button
        onClick={onToggle}
        className={['w-9 h-5 rounded-full transition-colors relative', value ? 'bg-[#1C3829]' : 'bg-[#E8E6E1]'].join(' ')}
        role="switch"
        aria-checked={value}
        aria-label={label}
      >
        <span
          className={['absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform', value ? 'translate-x-4' : 'translate-x-0.5'].join(' ')}
        />
      </button>
    </label>
  )
}

function AdvancedFilters() {
  const { filters, setFilter } = useSearchStore()
  const [open, setOpen] = useState(false)

  const hasValue =
    filters.minYearBuilt !== null ||
    filters.basement !== null ||
    filters.parking !== null ||
    filters.minStories !== null ||
    filters.maxDaysListed !== null ||
    filters.hasOpenHouse ||
    filters.comingSoon ||
    filters.maxMonthlyPayment !== null ||
    filters.maxHoaFee !== null ||
    filters.petFriendly ||
    filters.laundry ||
    filters.furnished ||
    filters.shortTerm

  const clearAdvanced = () => {
    ;(['minYearBuilt', 'maxYearBuilt', 'parking', 'minStories', 'maxDaysListed', 'maxMonthlyPayment', 'maxHoaFee'] as const)
      .forEach((k) => setFilter(k, null))
    ;(['basement', 'hasOpenHouse', 'comingSoon', 'petFriendly', 'laundry', 'utilitiesIncluded', 'furnished', 'shortTerm'] as const)
      .forEach((k) => {
        if (k === 'basement') setFilter(k, null)
        else setFilter(k, false)
      })
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={[
          'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium',
          'border whitespace-nowrap transition-colors',
          hasValue
            ? 'bg-[#1C3829] text-white border-[#1C3829]'
            : 'bg-white text-[#111111] border-[#E8E6E1] hover:border-[#1C3829]/40',
        ].join(' ')}
      >
        <SlidersHorizontal size={11} />
        More Filters
        {hasValue && <span className="ml-0.5 bg-white/20 text-white rounded-full px-1.5 text-[10px]">✓</span>}
        {!hasValue && <ChevronDown size={11} />}
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-2 bg-white rounded-xl border border-[#E8E6E1] shadow-xl shadow-black/10 z-50 w-[340px] p-4 max-h-[520px] overflow-y-auto">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-[#6B6B6B] uppercase tracking-wide">Advanced Filters</p>
            {hasValue && (
              <button onClick={clearAdvanced} className="text-xs text-[#1C3829] hover:underline">Clear all</button>
            )}
          </div>
          <p className="text-[11px] text-[#9B9B9B] mb-4 leading-snug">
            Year Built &amp; Parking filter live results. Other options below are coming soon.
          </p>

          {/* Year Built */}
          <div className="mb-4">
            <p className="text-sm font-semibold text-[#111111] mb-2">Year Built</p>
            <div className="grid grid-cols-2 gap-2">
              {(['minYearBuilt', 'maxYearBuilt'] as const).map((f) => (
                <input
                  key={f}
                  type="number"
                  placeholder={f === 'minYearBuilt' ? 'From' : 'To'}
                  value={filters[f] ?? ''}
                  onChange={(e) => setFilter(f, e.target.value ? Number(e.target.value) : null)}
                  min={1800} max={2026}
                  className="border border-[#E8E6E1] rounded-lg px-2.5 py-2 text-sm text-[#111111] focus:outline-none focus:border-[#1C3829]"
                />
              ))}
            </div>
          </div>

          {/* Parking */}
          <div className="mb-4">
            <p className="text-sm font-semibold text-[#111111] mb-2">Parking Spots</p>
            <div className="flex gap-1.5">
              {[null, 1, 2, 3].map((v) => (
                <button
                  key={v ?? 'any'}
                  onClick={() => setFilter('parking', v)}
                  className={[
                    'flex-1 py-1.5 rounded-lg text-xs font-medium border transition-colors',
                    filters.parking === v
                      ? 'bg-[#1C3829] text-white border-[#1C3829]'
                      : 'border-[#E8E6E1] text-[#111111] hover:border-[#1C3829]/40',
                  ].join(' ')}
                >
                  {v === null ? 'Any' : `${v}+`}
                </button>
              ))}
            </div>
          </div>

          {/* Stories */}
          <div className="mb-4">
            <p className="text-sm font-semibold text-[#111111] mb-2">Stories</p>
            <div className="flex gap-1.5">
              {[null, 1, 2, 3].map((v) => (
                <button
                  key={v ?? 'any'}
                  onClick={() => setFilter('minStories', v)}
                  className={[
                    'flex-1 py-1.5 rounded-lg text-xs font-medium border transition-colors',
                    filters.minStories === v
                      ? 'bg-[#1C3829] text-white border-[#1C3829]'
                      : 'border-[#E8E6E1] text-[#111111] hover:border-[#1C3829]/40',
                  ].join(' ')}
                >
                  {v === null ? 'Any' : `${v}+`}
                </button>
              ))}
            </div>
          </div>

          {/* Basement */}
          <div className="mb-4">
            <p className="text-sm font-semibold text-[#111111] mb-2">Basement</p>
            <div className="flex gap-1.5">
              {[null, true, false].map((v) => (
                <button
                  key={String(v)}
                  onClick={() => setFilter('basement', v)}
                  className={[
                    'flex-1 py-1.5 rounded-lg text-xs font-medium border transition-colors',
                    filters.basement === v
                      ? 'bg-[#1C3829] text-white border-[#1C3829]'
                      : 'border-[#E8E6E1] text-[#111111] hover:border-[#1C3829]/40',
                  ].join(' ')}
                >
                  {v === null ? 'Any' : v ? 'Yes' : 'No'}
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-[#E8E6E1] pt-4 mb-4">
            <p className="text-sm font-semibold text-[#111111] mb-2">Listing Status</p>
            <div>
              <label className="flex items-center gap-2 py-1 cursor-pointer">
                <input
                  type="number"
                  placeholder="Days on market (max)"
                  value={filters.maxDaysListed ?? ''}
                  onChange={(e) => setFilter('maxDaysListed', e.target.value ? Number(e.target.value) : null)}
                  className="flex-1 border border-[#E8E6E1] rounded-lg px-2.5 py-2 text-sm text-[#111111] focus:outline-none focus:border-[#1C3829]"
                />
              </label>
            </div>
            <ToggleRow label="Has open house" value={filters.hasOpenHouse} onToggle={() => setFilter('hasOpenHouse', !filters.hasOpenHouse)} />
            <ToggleRow label="Coming soon" value={filters.comingSoon} onToggle={() => setFilter('comingSoon', !filters.comingSoon)} />
          </div>

          <div className="border-t border-[#E8E6E1] pt-4 mb-4">
            <p className="text-sm font-semibold text-[#111111] mb-2">Financial</p>
            <input
              type="number"
              placeholder="Max monthly payment ($)"
              value={filters.maxMonthlyPayment ?? ''}
              onChange={(e) => setFilter('maxMonthlyPayment', e.target.value ? Number(e.target.value) : null)}
              className="w-full border border-[#E8E6E1] rounded-lg px-2.5 py-2 text-sm text-[#111111] focus:outline-none focus:border-[#1C3829] mb-2"
            />
            <input
              type="number"
              placeholder="Max HOA fee ($/month)"
              value={filters.maxHoaFee ?? ''}
              onChange={(e) => setFilter('maxHoaFee', e.target.value ? Number(e.target.value) : null)}
              className="w-full border border-[#E8E6E1] rounded-lg px-2.5 py-2 text-sm text-[#111111] focus:outline-none focus:border-[#1C3829]"
            />
          </div>

        </div>
      )}
    </div>
  )
}

// ─── Main FilterPanel ─────────────────────────────────────────────────────────

export default function FilterPanel() {
  const { resetFilters, filters } = useSearchStore()
  const scrollRef = useRef<HTMLDivElement>(null)

  const hasAnyFilter =
    filters.minPrice !== null ||
    filters.maxPrice !== null ||
    filters.beds !== null ||
    filters.baths !== null ||
    filters.structureType.length > 0 ||
    filters.minSqft !== null ||
    filters.maxSqft !== null

  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-white border-b border-[#E8E6E1]">
      {/* Search bar — left side */}
      <div className="w-56 shrink-0">
        <SearchBar placeholder="Search city, address…" className="h-8 text-xs" />
      </div>

      {/* Divider */}
      <div className="w-px h-5 bg-[#E8E6E1] shrink-0" />

      {/* Scrollable filter chips */}
      <div
        ref={scrollRef}
        className="flex items-center gap-2 overflow-x-auto flex-1 min-w-0"
        style={{ scrollbarWidth: 'none' }}
      >
        <PriceRangeFilter />
        <BedsAndBathsFilter />
        <HomeTypeFilter />
        <SizeFilter />
      </div>

      {/* Advanced + Save + Clear */}
      <div className="flex items-center gap-2 shrink-0">
        <AdvancedFilters />
        <SaveSearch />
        {hasAnyFilter && (
          <button
            onClick={resetFilters}
            className="text-xs text-[#6B6B6B] hover:text-[#1C3829] transition-colors whitespace-nowrap"
          >
            Clear
          </button>
        )}
      </div>

      {/* Divider */}
      <div className="w-px h-5 bg-[#E8E6E1] shrink-0" />

      {/* View toggle — right side */}
      <div className="shrink-0">
        <ViewToggle />
      </div>
    </div>
  )
}
