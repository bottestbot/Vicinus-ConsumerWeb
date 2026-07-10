'use client'

import { useState, useRef, useEffect } from 'react'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { ChevronDown, SlidersHorizontal } from 'lucide-react'
import { useSearchStore } from '@/store/searchStore'
import { HOME_TYPES } from '@/types/search'
import { searchProperties, type SearchParams } from '@/lib/api/search'
import { glass, PILL_ACTIVE, type GlassTheme } from './glassTheme'
import SaveSearch from './SaveSearch'
import SearchBar from './SearchBar'
import ViewToggle from './ViewToggle'

// ─── Small building blocks ────────────────────────────────────────────────────

function SectionLabel({ theme, children }: { theme: GlassTheme; children: React.ReactNode }) {
  return (
    <p className={`text-xs font-semibold ${glass(theme).textMuted} mb-2 uppercase tracking-wide`}>{children}</p>
  )
}

// A row of pill buttons where exactly one value is selected (single-select).
function Segmented<T extends string | number | boolean | null>({
  theme,
  options,
  value,
  onChange,
  render,
}: {
  theme: GlassTheme
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
            value === v ? PILL_ACTIVE : glass(theme).pillIdle,
          ].join(' ')}
        >
          {render(v)}
        </button>
      ))}
    </div>
  )
}

function ToggleRow({
  theme,
  label,
  value,
  onToggle,
}: {
  theme: GlassTheme
  label: string
  value: boolean
  onToggle: () => void
}) {
  const t = glass(theme)
  return (
    <label className="flex items-center justify-between py-1.5 cursor-pointer group">
      <span className={`text-sm ${t.text} opacity-90 group-hover:opacity-100 transition-opacity`}>{label}</span>
      <button
        onClick={onToggle}
        className={['w-9 h-5 rounded-full transition-colors relative', value ? 'bg-[#1C3829]' : t.toggleOff].join(' ')}
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

function FiltersDropdown({ theme, onClose }: { theme: GlassTheme; onClose: () => void }) {
  const { filters, setFilter, resetFilters } = useSearchStore()
  const count = useResultCount()
  const t = glass(theme)
  const inputCls = `w-full rounded-lg px-2.5 py-2 text-sm ${t.input}`

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
        'absolute top-full right-0 mt-2 w-[360px] max-w-[calc(100vw-2rem)] rounded-2xl z-[100]',
        'max-h-[70vh] overflow-y-auto',
        t.surface,
        t.text,
      ].join(' ')}
    >
      <div className="p-4 space-y-5">
        <p className={`text-xs font-semibold ${t.textFaint} uppercase tracking-widest`}>Filters</p>

        {/* Price range */}
        <div>
          <SectionLabel theme={theme}>Price range</SectionLabel>
          <div className="grid grid-cols-2 gap-3">
            <select
              value={filters.minPrice ?? ''}
              onChange={(e) => setFilter('minPrice', e.target.value ? Number(e.target.value) : null)}
              className={inputCls}
            >
              {MIN_PRICE.map((v) => (
                <option key={v ?? 'any'} value={v ?? ''} className="text-black">{v === null ? 'Min' : fmtPrice(v)}</option>
              ))}
            </select>
            <select
              value={filters.maxPrice ?? ''}
              onChange={(e) => setFilter('maxPrice', e.target.value ? Number(e.target.value) : null)}
              className={inputCls}
            >
              {MAX_PRICE.map((v) => (
                <option key={v ?? 'any'} value={v ?? ''} className="text-black">{v === null ? 'Max' : fmtPrice(v)}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Beds */}
        <div>
          <SectionLabel theme={theme}>Beds</SectionLabel>
          <Segmented
            theme={theme}
            options={COUNTS}
            value={filters.beds}
            onChange={(v) => setFilter('beds', v)}
            render={(v) => (v === null ? 'Any' : exact ? `${v}` : `${v}+`)}
          />
        </div>

        {/* Baths */}
        <div>
          <SectionLabel theme={theme}>Baths</SectionLabel>
          <Segmented
            theme={theme}
            options={[null, 1, 2, 3]}
            value={filters.baths}
            onChange={(v) => setFilter('baths', v)}
            render={(v) => (v === null ? 'Any' : exact ? `${v}` : `${v}+`)}
          />
          <label className={`flex items-center gap-2 pt-2.5 text-sm ${t.text} opacity-90 cursor-pointer select-none`}>
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
          <SectionLabel theme={theme}>Home type</SectionLabel>
          <div className="flex flex-wrap gap-2">
            {HOME_TYPES.map((ht) => (
              <button
                key={ht.label}
                onClick={() => toggleType(ht.values)}
                className={[
                  'py-2 px-3.5 rounded-full text-xs font-medium border transition-colors',
                  isTypeOn(ht.values) ? PILL_ACTIVE : t.pillIdle,
                ].join(' ')}
              >
                {ht.label}
              </button>
            ))}
          </div>
        </div>

        {/* Size */}
        <div>
          <SectionLabel theme={theme}>Size (sqft)</SectionLabel>
          <div className="grid grid-cols-2 gap-3">
            {(['minSqft', 'maxSqft'] as const).map((field) => (
              <select
                key={field}
                value={filters[field] ?? ''}
                onChange={(e) => setFilter(field, e.target.value ? Number(e.target.value) : null)}
                className={inputCls}
              >
                {SQFT.map((v) => (
                  <option key={v ?? 'any'} value={v ?? ''} className="text-black">
                    {v === null ? (field === 'minSqft' ? 'Min' : 'Max') : `${v.toLocaleString()} sqft`}
                  </option>
                ))}
              </select>
            ))}
          </div>
        </div>

        {/* ── Advanced ─────────────────────────────────────────────────────── */}
        <div className={`border-t ${t.borderSoft} pt-4`}>
          <p className={`text-xs font-semibold ${t.textFaint} uppercase tracking-widest mb-1`}>Advanced filters</p>
          <p className={`text-[11px] ${t.textFaint} mb-4 leading-snug`}>
            Year built and parking filter live results. Other options below are coming soon.
          </p>

          {/* Year built */}
          <div className="mb-4">
            <SectionLabel theme={theme}>Year built</SectionLabel>
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
                  className={`rounded-lg px-2.5 py-2 text-sm ${t.input}`}
                />
              ))}
            </div>
          </div>

          {/* Parking */}
          <div className="mb-4">
            <SectionLabel theme={theme}>Parking spots</SectionLabel>
            <Segmented
              theme={theme}
              options={[null, 1, 2, 3]}
              value={filters.parking}
              onChange={(v) => setFilter('parking', v)}
              render={(v) => (v === null ? 'Any' : `${v}+`)}
            />
          </div>

          {/* Stories */}
          <div className="mb-4">
            <SectionLabel theme={theme}>Stories</SectionLabel>
            <Segmented
              theme={theme}
              options={[null, 1, 2, 3]}
              value={filters.minStories}
              onChange={(v) => setFilter('minStories', v)}
              render={(v) => (v === null ? 'Any' : `${v}+`)}
            />
          </div>

          {/* Basement */}
          <div className="mb-4">
            <SectionLabel theme={theme}>Basement</SectionLabel>
            <Segmented
              theme={theme}
              options={[null, true, false] as (boolean | null)[]}
              value={filters.basement}
              onChange={(v) => setFilter('basement', v)}
              render={(v) => (v === null ? 'Any' : v ? 'Yes' : 'No')}
            />
          </div>

          <div className={`border-t ${t.borderSoft} pt-4 mb-2`}>
            <SectionLabel theme={theme}>Listing status</SectionLabel>
            <input
              type="number"
              placeholder="Days on market (max)"
              value={filters.maxDaysListed ?? ''}
              onChange={(e) => setFilter('maxDaysListed', e.target.value ? Number(e.target.value) : null)}
              className={`w-full mb-1.5 rounded-lg px-2.5 py-2 text-sm ${t.input}`}
            />
            <ToggleRow theme={theme} label="Has open house" value={filters.hasOpenHouse} onToggle={() => setFilter('hasOpenHouse', !filters.hasOpenHouse)} />
            <ToggleRow theme={theme} label="Coming soon" value={filters.comingSoon} onToggle={() => setFilter('comingSoon', !filters.comingSoon)} />
          </div>

          <div className={`border-t ${t.borderSoft} pt-4`}>
            <SectionLabel theme={theme}>Financial</SectionLabel>
            <input
              type="number"
              placeholder="Max monthly payment ($)"
              value={filters.maxMonthlyPayment ?? ''}
              onChange={(e) => setFilter('maxMonthlyPayment', e.target.value ? Number(e.target.value) : null)}
              className={`w-full mb-2 rounded-lg px-2.5 py-2 text-sm ${t.input}`}
            />
            <input
              type="number"
              placeholder="Max HOA fee ($/month)"
              value={filters.maxHoaFee ?? ''}
              onChange={(e) => setFilter('maxHoaFee', e.target.value ? Number(e.target.value) : null)}
              className={`w-full rounded-lg px-2.5 py-2 text-sm ${t.input}`}
            />
          </div>
        </div>
      </div>

      {/* Sticky footer — Reset + Show results */}
      <div className={`sticky bottom-0 flex items-center gap-3 px-4 py-3 backdrop-blur border-t ${t.borderSoft} ${theme === 'dark' ? 'bg-[#141817]/95' : 'bg-white/95'}`}>
        <button
          onClick={resetFilters}
          className={`flex-1 py-2.5 rounded-full text-sm font-medium border transition-colors ${t.pillIdle}`}
        >
          Reset
        </button>
        <button
          onClick={onClose}
          className="flex-1 py-2.5 rounded-full text-sm font-semibold bg-[#1C3829] text-white hover:bg-[#2D5A3D] transition-colors"
        >
          {count !== null ? `Show ${count.toLocaleString()} results` : 'Show results'}
        </button>
      </div>
    </div>
  )
}

// ─── Main FilterPanel — floating glass bar ────────────────────────────────────

export default function FilterPanel({ theme = 'dark' }: { theme?: GlassTheme }) {
  const { filters } = useSearchStore()
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)
  const t = glass(theme)

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
    <div className={`flex items-center gap-2 sm:gap-3 px-2.5 py-2 rounded-full ${t.bar}`}>
      {/* Search — flexes to fill available width */}
      <div className="flex-1 min-w-0">
        <SearchBar theme={theme} placeholder="Search city, address…" className="h-9 text-xs" />
      </div>

      {/* Filter button + combined dropdown */}
      <div ref={wrapRef} className="relative shrink-0">
        <button
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className={[
            'inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full text-xs font-medium border transition-colors whitespace-nowrap',
            hasAnyFilter ? PILL_ACTIVE : t.chipIdle,
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

        {open && <FiltersDropdown theme={theme} onClose={() => setOpen(false)} />}
      </div>

      {/* Save search — hidden on the narrowest screens to keep the bar compact */}
      <div className="hidden sm:block shrink-0">
        <SaveSearch theme={theme} />
      </div>

      {/* Divider */}
      <div className={`w-px h-5 shrink-0 hidden sm:block ${t.divider}`} />

      {/* View toggle — Feed / Map */}
      <div className="shrink-0">
        <ViewToggle theme={theme} />
      </div>
    </div>
  )
}
