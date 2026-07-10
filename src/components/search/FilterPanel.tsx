'use client'

import { useState, useRef, useEffect } from 'react'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { ChevronDown, SlidersHorizontal } from 'lucide-react'
import { useSearchStore } from '@/store/searchStore'
import { HOME_TYPES } from '@/types/search'
import { searchProperties, type SearchParams } from '@/lib/api/search'
import SaveSearch from './SaveSearch'
import SearchBar from './SearchBar'
import ViewToggle from './ViewToggle'

// ─── Small building blocks ────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold text-[#6B6B6B] mb-2 uppercase tracking-wide">{children}</p>
  )
}

// A row of pill buttons where exactly one value is selected (single-select).
function Segmented<T extends string | number | boolean | null>({
  options,
  value,
  onChange,
  render,
}: {
  options: T[]
  value: T
  onChange: (v: T) => void
  render: (v: T) => string
}) {
  return (
    <div className="flex gap-1.5">
      {options.map((v) => (
        <button
          key={String(v)}
          onClick={() => onChange(v)}
          className={[
            'flex-1 py-1.5 rounded-full text-xs font-medium border transition-colors',
            value === v
              ? 'bg-[#1C3829] text-white border-[#1C3829]'
              : 'border-[#E8E6E1] text-[#111111] hover:border-[#1C3829]/40',
          ].join(' ')}
        >
          {render(v)}
        </button>
      ))}
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

// ─── Live result count for the dropdown footer ────────────────────────────────

// Mirrors the Feed's param mapping (city-scoped, Active by default) so the count
// tracks what the Feed/Map will actually show. bbox is intentionally omitted —
// this is a coarse "how many match these filters" number, not a map query.
function useResultCount(): number | null {
  const { filters, query, userCity } = useSearchStore()

  const params: SearchParams = {
    q: query || undefined,
    minPrice: filters.minPrice ?? undefined,
    maxPrice: filters.maxPrice ?? undefined,
    beds: filters.beds ?? undefined,
    baths: filters.baths ?? undefined,
    exactBedsBaths:
      filters.bedsBathsExact && (filters.beds !== null || filters.baths !== null) ? true : undefined,
    structureType: filters.structureType.length > 0 ? filters.structureType.join(',') : undefined,
    status: filters.status || 'Active',
    listingType: filters.listingType || undefined,
    minSqft: filters.minSqft ?? undefined,
    maxSqft: filters.maxSqft ?? undefined,
    parkingMin: filters.parking ?? undefined,
    yearBuiltMin: filters.minYearBuilt ?? undefined,
    city: query ? undefined : userCity || 'Vancouver',
    limit: 1,
    page: 1,
  }

  const { data } = useQuery({
    queryKey: ['filter-count', params],
    queryFn: () => searchProperties(params).then((r) => (r.data as { total?: number }).total ?? null),
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  })

  return typeof data === 'number' ? data : null
}

// ─── Combined filters dropdown (Basic + Advanced) ─────────────────────────────

function FiltersDropdown({ onClose }: { onClose: () => void }) {
  const { filters, setFilter, resetFilters } = useSearchStore()
  const count = useResultCount()

  const MIN_PRICE = [null, 500_000, 1_000_000, 2_000_000, 3_000_000, 5_000_000]
  const MAX_PRICE = [null, 1_000_000, 2_000_000, 3_000_000, 5_000_000, 10_000_000]
  const SQFT = [null, 500, 1000, 1500, 2000, 3000, 5000]
  const COUNTS = [null, 1, 2, 3, 4]
  const fmtPrice = (v: number | null) =>
    v === null ? 'Any' : v >= 1_000_000 ? `$${(v / 1e6).toFixed(1)}M` : `$${(v / 1000).toFixed(0)}K`

  const exact = filters.bedsBathsExact
  const isTypeOn = (values: string[]) => values.every((v) => filters.structureType.includes(v))
  const toggleType = (values: string[]) => {
    const next = isTypeOn(values)
      ? filters.structureType.filter((v) => !values.includes(v))
      : [...new Set([...filters.structureType, ...values])]
    setFilter('structureType', next)
  }

  return (
    <div
      className={[
        'absolute top-full right-0 mt-2 w-[360px] max-w-[calc(100vw-2rem)]',
        'bg-white rounded-2xl border border-[#E8E6E1] shadow-xl shadow-black/10 z-[100]',
        'max-h-[70vh] overflow-y-auto',
      ].join(' ')}
    >
      <div className="p-4 space-y-5">
        <p className="text-xs font-semibold text-[#9B9B9B] uppercase tracking-widest">Filters</p>

        {/* Price range */}
        <div>
          <SectionLabel>Price range</SectionLabel>
          <div className="grid grid-cols-2 gap-3">
            <select
              value={filters.minPrice ?? ''}
              onChange={(e) => setFilter('minPrice', e.target.value ? Number(e.target.value) : null)}
              className="w-full text-sm border border-[#E8E6E1] rounded-lg px-2.5 py-2 text-[#111111] focus:outline-none focus:border-[#1C3829]"
            >
              {MIN_PRICE.map((v) => (
                <option key={v ?? 'any'} value={v ?? ''}>{v === null ? 'Min' : fmtPrice(v)}</option>
              ))}
            </select>
            <select
              value={filters.maxPrice ?? ''}
              onChange={(e) => setFilter('maxPrice', e.target.value ? Number(e.target.value) : null)}
              className="w-full text-sm border border-[#E8E6E1] rounded-lg px-2.5 py-2 text-[#111111] focus:outline-none focus:border-[#1C3829]"
            >
              {MAX_PRICE.map((v) => (
                <option key={v ?? 'any'} value={v ?? ''}>{v === null ? 'Max' : fmtPrice(v)}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Beds */}
        <div>
          <SectionLabel>Beds</SectionLabel>
          <Segmented
            options={COUNTS}
            value={filters.beds}
            onChange={(v) => setFilter('beds', v)}
            render={(v) => (v === null ? 'Any' : exact ? `${v}` : `${v}+`)}
          />
        </div>

        {/* Baths */}
        <div>
          <SectionLabel>Baths</SectionLabel>
          <Segmented
            options={[null, 1, 2, 3]}
            value={filters.baths}
            onChange={(v) => setFilter('baths', v)}
            render={(v) => (v === null ? 'Any' : exact ? `${v}` : `${v}+`)}
          />
          <label className="flex items-center gap-2 pt-2.5 text-sm text-[#111111] cursor-pointer select-none">
            <input
              type="checkbox"
              checked={exact}
              onChange={(e) => setFilter('bedsBathsExact', e.target.checked)}
              className="accent-[#1C3829] w-4 h-4"
            />
            Use exact match
          </label>
        </div>

        {/* Home type */}
        <div>
          <SectionLabel>Home type</SectionLabel>
          <div className="flex flex-wrap gap-2">
            {HOME_TYPES.map((t) => (
              <button
                key={t.label}
                onClick={() => toggleType(t.values)}
                className={[
                  'py-2 px-3.5 rounded-full text-xs font-medium border transition-colors',
                  isTypeOn(t.values)
                    ? 'bg-[#1C3829] text-white border-[#1C3829]'
                    : 'border-[#E8E6E1] text-[#111111] hover:border-[#1C3829]/40',
                ].join(' ')}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Size */}
        <div>
          <SectionLabel>Size (sqft)</SectionLabel>
          <div className="grid grid-cols-2 gap-3">
            {(['minSqft', 'maxSqft'] as const).map((field) => (
              <select
                key={field}
                value={filters[field] ?? ''}
                onChange={(e) => setFilter(field, e.target.value ? Number(e.target.value) : null)}
                className="w-full text-sm border border-[#E8E6E1] rounded-lg px-2.5 py-2 text-[#111111] focus:outline-none focus:border-[#1C3829]"
              >
                {SQFT.map((v) => (
                  <option key={v ?? 'any'} value={v ?? ''}>
                    {v === null ? (field === 'minSqft' ? 'Min' : 'Max') : `${v.toLocaleString()} sqft`}
                  </option>
                ))}
              </select>
            ))}
          </div>
        </div>

        {/* ── Advanced ─────────────────────────────────────────────────────── */}
        <div className="border-t border-[#E8E6E1] pt-4">
          <p className="text-xs font-semibold text-[#9B9B9B] uppercase tracking-widest mb-1">Advanced filters</p>
          <p className="text-[11px] text-[#9B9B9B] mb-4 leading-snug">
            Year built and parking filter live results. Other options below are coming soon.
          </p>

          {/* Year built */}
          <div className="mb-4">
            <SectionLabel>Year built</SectionLabel>
            <div className="grid grid-cols-2 gap-2">
              {(['minYearBuilt', 'maxYearBuilt'] as const).map((f) => (
                <input
                  key={f}
                  type="number"
                  placeholder={f === 'minYearBuilt' ? 'From' : 'To'}
                  value={filters[f] ?? ''}
                  onChange={(e) => setFilter(f, e.target.value ? Number(e.target.value) : null)}
                  min={1800}
                  max={2026}
                  className="border border-[#E8E6E1] rounded-lg px-2.5 py-2 text-sm text-[#111111] focus:outline-none focus:border-[#1C3829]"
                />
              ))}
            </div>
          </div>

          {/* Parking */}
          <div className="mb-4">
            <SectionLabel>Parking spots</SectionLabel>
            <Segmented
              options={[null, 1, 2, 3]}
              value={filters.parking}
              onChange={(v) => setFilter('parking', v)}
              render={(v) => (v === null ? 'Any' : `${v}+`)}
            />
          </div>

          {/* Stories */}
          <div className="mb-4">
            <SectionLabel>Stories</SectionLabel>
            <Segmented
              options={[null, 1, 2, 3]}
              value={filters.minStories}
              onChange={(v) => setFilter('minStories', v)}
              render={(v) => (v === null ? 'Any' : `${v}+`)}
            />
          </div>

          {/* Basement */}
          <div className="mb-4">
            <SectionLabel>Basement</SectionLabel>
            <Segmented
              options={[null, true, false] as (boolean | null)[]}
              value={filters.basement}
              onChange={(v) => setFilter('basement', v)}
              render={(v) => (v === null ? 'Any' : v ? 'Yes' : 'No')}
            />
          </div>

          <div className="border-t border-[#E8E6E1] pt-4 mb-2">
            <SectionLabel>Listing status</SectionLabel>
            <input
              type="number"
              placeholder="Days on market (max)"
              value={filters.maxDaysListed ?? ''}
              onChange={(e) => setFilter('maxDaysListed', e.target.value ? Number(e.target.value) : null)}
              className="w-full border border-[#E8E6E1] rounded-lg px-2.5 py-2 text-sm text-[#111111] focus:outline-none focus:border-[#1C3829] mb-1.5"
            />
            <ToggleRow label="Has open house" value={filters.hasOpenHouse} onToggle={() => setFilter('hasOpenHouse', !filters.hasOpenHouse)} />
            <ToggleRow label="Coming soon" value={filters.comingSoon} onToggle={() => setFilter('comingSoon', !filters.comingSoon)} />
          </div>

          <div className="border-t border-[#E8E6E1] pt-4">
            <SectionLabel>Financial</SectionLabel>
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
      </div>

      {/* Sticky footer — Reset + Show results */}
      <div className="sticky bottom-0 flex items-center gap-3 px-4 py-3 bg-white/95 backdrop-blur border-t border-[#E8E6E1]">
        <button
          onClick={resetFilters}
          className="flex-1 py-2.5 rounded-full text-sm font-medium border border-[#E8E6E1] text-[#111111] hover:border-[#1C3829]/40 transition-colors"
        >
          Reset
        </button>
        <button
          onClick={onClose}
          className="flex-1 py-2.5 rounded-full text-sm font-semibold bg-[#1C3829] text-white hover:bg-[#16301F] transition-colors"
        >
          {count !== null ? `Show ${count.toLocaleString()} results` : 'Show results'}
        </button>
      </div>
    </div>
  )
}

// ─── Main FilterPanel — floating glass bar ────────────────────────────────────

export default function FilterPanel() {
  const { filters } = useSearchStore()
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  // Count of active filter *groups* — drives the button badge + highlight.
  const activeCount =
    (filters.minPrice !== null || filters.maxPrice !== null ? 1 : 0) +
    (filters.beds !== null || filters.baths !== null ? 1 : 0) +
    (filters.structureType.length > 0 ? 1 : 0) +
    (filters.minSqft !== null || filters.maxSqft !== null ? 1 : 0) +
    (filters.minYearBuilt !== null || filters.maxYearBuilt !== null ? 1 : 0) +
    (filters.parking !== null ? 1 : 0) +
    (filters.minStories !== null ? 1 : 0) +
    (filters.basement !== null ? 1 : 0) +
    (filters.maxDaysListed !== null || filters.hasOpenHouse || filters.comingSoon ? 1 : 0) +
    (filters.maxMonthlyPayment !== null || filters.maxHoaFee !== null ? 1 : 0)
  const hasAnyFilter = activeCount > 0

  // Close the dropdown on outside click.
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div className="flex items-center gap-2 sm:gap-3 px-2.5 py-2 rounded-full bg-white/70 backdrop-blur-xl border border-white/50 shadow-lg shadow-black/10">
      {/* Search — flexes to fill available width */}
      <div className="flex-1 min-w-0">
        <SearchBar placeholder="Search city, address…" className="h-9 text-xs" />
      </div>

      {/* Filter button + combined dropdown */}
      <div ref={wrapRef} className="relative shrink-0">
        <button
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className={[
            'inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full text-xs font-medium border transition-colors whitespace-nowrap',
            hasAnyFilter
              ? 'bg-[#1C3829] text-white border-[#1C3829]'
              : 'bg-white/80 text-[#111111] border-[#E8E6E1] hover:border-[#1C3829]/40',
          ].join(' ')}
        >
          <SlidersHorizontal size={13} />
          <span className="hidden sm:inline">Filter</span>
          {hasAnyFilter ? (
            <span className="ml-0.5 bg-white/25 text-white rounded-full min-w-[16px] px-1 text-[10px] leading-4 text-center">
              {activeCount}
            </span>
          ) : (
            <ChevronDown size={12} className="hidden sm:inline" />
          )}
        </button>

        {open && <FiltersDropdown onClose={() => setOpen(false)} />}
      </div>

      {/* Save search — hidden on the narrowest screens to keep the bar compact */}
      <div className="hidden sm:block shrink-0">
        <SaveSearch />
      </div>

      {/* Divider */}
      <div className="w-px h-5 bg-[#E8E6E1]/70 shrink-0 hidden sm:block" />

      {/* View toggle — Feed / Map */}
      <div className="shrink-0">
        <ViewToggle />
      </div>
    </div>
  )
}
