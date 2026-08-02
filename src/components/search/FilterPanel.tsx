'use client'

import { useState, useRef } from 'react'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { ChevronDown, SlidersHorizontal } from 'lucide-react'
import { useSearchStore } from '@/store/searchStore'
import { HOME_TYPES, type SearchFiltersExtended } from '@/types/search'
import { searchProperties, type SearchParams } from '@/lib/api/search'
import { filtersToSearchParams } from '@/lib/searchFilters'
import { formatNumber } from '@/lib/format'
import { track } from '@/lib/analytics/capture'
import { glass, PILL_ACTIVE, type GlassTheme } from './glassTheme'
import ListingTypeToggle from './ListingTypeToggle'
import PriceFilterPopover from './PriceFilterPopover'
import ResponsivePopover from './ResponsivePopover'
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
    // Same mapping as the live search — shared so the two can't drift.
    ...filtersToSearchParams(filters, query),
    status: filters.status || 'Active',
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
  const { filters, setFilter: setFilterRaw, resetFilters } = useSearchStore()
  const count = useResultCount()
  const t = glass(theme)
  const inputCls = `w-full rounded-lg px-2.5 py-2 text-sm ${t.input}`

  // Wraps the store's setFilter so every filter change in this dropdown also
  // fires filter_applied — a single choke point instead of a track() call at
  // every individual control below.
  const setFilter = <K extends keyof SearchFiltersExtended>(name: K, value: SearchFiltersExtended[K]) => {
    setFilterRaw(name, value)
    track('filter_applied', { filter_name: name, filter_value: value })
  }

  const SQFT = [null, 500, 1000, 1500, 2000, 3000, 5000]
  const COUNTS = [null, 1, 2, 3, 4]

  const exact = filters.bedsBathsExact
  const isTypeOn = (values: string[]) => values.every((v) => filters.structureType.includes(v))
  const toggleType = (values: string[]) => {
    const next = isTypeOn(values)
      ? filters.structureType.filter((v) => !values.includes(v))
      : [...new Set([...filters.structureType, ...values])]
    setFilter('structureType', next)
  }

  return (
    <>
      <div className="p-4 space-y-5">
        <p className={`text-xs font-semibold ${t.textFaint} uppercase tracking-widest`}>Filters</p>

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
                    {v === null ? (field === 'minSqft' ? 'Min' : 'Max') : `${formatNumber(v)} sqft`}
                  </option>
                ))}
              </select>
            ))}
          </div>
        </div>

        {/* ── Advanced ─────────────────────────────────────────────────────── */}
        <div className={`border-t ${t.borderSoft} pt-4`}>
          <p className={`text-xs font-semibold ${t.textFaint} uppercase tracking-widest mb-4`}>Advanced filters</p>

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

          {/* Basement — tri-state. DDF publishes Basement on a minority of
              listings, so "Yes"/"No" narrow to listings that actually declare
              one either way (see BASEMENT_PRESENT_VALUES on the API side). */}
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
              min={1}
              className={`w-full mb-1.5 rounded-lg px-2.5 py-2 text-sm ${t.input}`}
            />
            {/* "Has open house" is hidden rather than shown-as-coming-soon: the
                badge on result cards already advertises open houses, so an
                inert toggle sitting next to it reads as broken rather than
                unfinished. The `hasOpenHouse` store field and its default stay
                put — the filter is designed (index-driven intersection against
                the DDF OpenHouse resource; see the open-house filter plan) and
                this is a UI-only hide, so restoring it is a one-line revert.

                "Coming soon" cannot be queried at all: CREA made StandardStatus
                non-filterable in 2026-07 and the Property feed is active-only.
                Left visible but clearly marked, and excluded from the Filter
                badge below so it can never claim a filter that isn't applied. */}
            <p className={`text-[11px] ${t.textFaint} mt-2 mb-1 leading-snug`}>Coming soon — this doesn&apos;t narrow results yet</p>
            <ToggleRow theme={theme} label="Coming soon" value={filters.comingSoon} onToggle={() => setFilter('comingSoon', !filters.comingSoon)} />
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
          {count !== null ? `Show ${formatNumber(count)} results` : 'Show results'}
        </button>
      </div>
    </>
  )
}

// ─── Main FilterPanel — floating glass bar ────────────────────────────────────

export default function FilterPanel({ theme = 'dark' }: { theme?: GlassTheme }) {
  const { filters } = useSearchStore()
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)
  const t = glass(theme)

  // Count of active filter *groups* — drives the button badge + highlight.
  // Price has its own pill/popover now, so it's intentionally excluded here.
  //
  // Only filters that actually reach the API are counted. `hasOpenHouse` and
  // `comingSoon` are deliberately absent: they have no DDF query behind them
  // (see the dropdown), and counting them made the badge claim a filter was
  // narrowing results when nothing had changed.
  const activeCount =
    (filters.beds !== null || filters.baths !== null ? 1 : 0) +
    (filters.structureType.length > 0 ? 1 : 0) +
    (filters.minSqft !== null || filters.maxSqft !== null ? 1 : 0) +
    (filters.minYearBuilt !== null || filters.maxYearBuilt !== null ? 1 : 0) +
    (filters.parking !== null ? 1 : 0) +
    (filters.basement !== null ? 1 : 0) +
    (filters.maxDaysListed !== null ? 1 : 0)
  const hasAnyFilter = activeCount > 0

  return (
    <div
      className={`flex flex-col gap-2 px-2.5 py-2 rounded-3xl @min-[700px]:flex-row @min-[700px]:items-center @min-[700px]:gap-3 @min-[700px]:rounded-full ${t.bar}`}
    >
      {/* Search — its own row until the bar is wide enough for the full control
          set on one line (~700px). Sharing a row below that left it ~18px wide
          at 412px, so the input overflowed under the pills with nowhere to
          type. The min-width floor stops it collapsing again. */}
      <div className="w-full @min-[700px]:flex-1 @min-[700px]:min-w-[7rem]">
        <SearchBar theme={theme} placeholder="Search city, address…" className="h-9 text-xs" />
      </div>

      {/* Controls — a wrapping row on phones/tablets; `contents` from md up so
          they become direct children of the bar again and the desktop layout
          is unchanged. */}
      <div className="flex flex-wrap items-center gap-2 @min-[700px]:contents">
        {/* Buy / Rent — top-level listing-type toggle (RENT-02) */}
        <ListingTypeToggle theme={theme} />

        {/* Price — its own pill + popover */}
        <PriceFilterPopover theme={theme} />

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

          <ResponsivePopover open={open} onClose={() => setOpen(false)} theme={theme} anchorRef={wrapRef}>
            <FiltersDropdown theme={theme} onClose={() => setOpen(false)} />
          </ResponsivePopover>
        </div>

        {/* Save search — hidden on the narrowest screens to keep the bar compact */}
        <div className="hidden sm:block shrink-0">
          <SaveSearch theme={theme} />
        </div>

        {/* Divider */}
        <div className={`w-px h-5 shrink-0 hidden sm:block ${t.divider}`} />

        {/* View toggle — Feed / Map. Pushed to the trailing edge on phones. */}
        <div className="shrink-0 ml-auto @min-[700px]:ml-0">
          <ViewToggle theme={theme} />
        </div>
      </div>
    </div>
  )
}
