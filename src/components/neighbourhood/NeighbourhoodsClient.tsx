'use client'

import { Suspense, useCallback, useState, useMemo, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, X } from 'lucide-react'
import { useSearchStore } from '@/store/searchStore'
import type { Neighbourhood } from '@/types/neighbourhood'
import NeighbourhoodGrid, {
  ALL_CITIES,
  browsableNeighbourhoods,
  defaultProvince,
  filterNeighbourhoods,
} from './NeighbourhoodGrid'

// Cities shown as pills before the "Show all" affordance reveals the full list.
const COLLAPSED_CITY_LIMIT = 8

const PROVINCE_LABELS: Record<string, string> = {
  BC: 'British Columbia',
  ON: 'Ontario',
  QC: 'Quebec',
  AB: 'Alberta',
  MB: 'Manitoba',
  SK: 'Saskatchewan',
  NS: 'Nova Scotia',
  NB: 'New Brunswick',
  NL: 'Newfoundland',
  PE: 'PEI',
}

// ── Filter derivation ─────────────────────────────────────────────────────────

interface FilterOption {
  label: string
  key: string
  count: number
}

function deriveFilters(all: Neighbourhood[], selectedProvince: string): {
  provinceOptions: FilterOption[]
  cityOptions: FilterOption[]
} {
  const provinceCounts = new Map<string, number>()
  for (const n of all) {
    provinceCounts.set(n.province, (provinceCounts.get(n.province) ?? 0) + 1)
  }

  const provinceOptions: FilterOption[] = [
    { label: 'All Canada', key: 'all', count: all.length },
    ...Array.from(provinceCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([province, count]) => ({ label: province, key: province, count })),
  ]

  const inProvince = selectedProvince === 'all' ? [] : all.filter((n) => n.province === selectedProvince)
  const cityCounts = new Map<string, number>()
  for (const n of inProvince) {
    cityCounts.set(n.city, (cityCounts.get(n.city) ?? 0) + 1)
  }

  const cityOptions: FilterOption[] = Array.from(cityCounts.entries())
    .map(([city, count]) => ({ label: city, key: city, count }))

  return { provinceOptions, cityOptions }
}

// ── Search ────────────────────────────────────────────────────────────────────
//
// Client-side only — all rows are already loaded, and 112 entries is cheap to
// scan on every keystroke. Search runs against the FULL set, independent of
// the active province/city pills, so a search can surface a result outside
// whatever's currently selected.

const SEARCH_NEIGHBOURHOOD_LIMIT = 5
const SEARCH_CITY_LIMIT = 3

interface CityMatch {
  city: string
  province: string
  count: number
}

function matchNeighbourhoods(all: Neighbourhood[], query: string): Neighbourhood[] {
  const q = query.trim().toLowerCase()
  if (!q) return []
  return all.filter((n) => n.name.toLowerCase().includes(q) || n.city.toLowerCase().includes(q))
}

// Cities whose NAME matches the query (distinct from neighbourhoods that
// happen to sit in a matching city) — e.g. typing "surrey" should offer to
// jump straight to Surrey even though no neighbourhood is itself named Surrey.
function matchCities(all: Neighbourhood[], query: string): CityMatch[] {
  const q = query.trim().toLowerCase()
  if (!q) return []
  const counts = new Map<string, CityMatch>()
  for (const n of all) {
    if (!n.city.toLowerCase().includes(q)) continue
    const key = `${n.province}|${n.city}`
    const existing = counts.get(key)
    if (existing) existing.count += 1
    else counts.set(key, { city: n.city, province: n.province, count: 1 })
  }
  return Array.from(counts.values()).sort((a, b) => b.count - a.count)
}

// Results ranked name-starts-with-query first, then alphabetical — a search
// for "kits" should lead with Kitsilano, not an unrelated mid-name match.
function rankByQuery(matches: Neighbourhood[], query: string): Neighbourhood[] {
  const q = query.trim().toLowerCase()
  return [...matches].sort((a, b) => {
    const aStarts = a.name.toLowerCase().startsWith(q) ? 0 : 1
    const bStarts = b.name.toLowerCase().startsWith(q) ? 0 : 1
    if (aStarts !== bStarts) return aStarts - bStarts
    return a.name.localeCompare(b.name)
  })
}

// ── NBR-03: context-aware selection ──────────────────────────────────────────

function contextMatch(all: Neighbourhood[], query: string | null, userCity: string | null): { province: string; city: string } | null {
  const q = (query || userCity || '').toLowerCase().trim()
  if (!q) return null
  const match = all.find((n) => n.city.toLowerCase() === q)
  if (match) return { province: match.province, city: match.city }
  return null
}

// ── ?city= reader (SEO-02) ────────────────────────────────────────────────────
//
// `useSearchParams` opts the calling Client Component tree out of prerendering up
// to the nearest Suspense boundary — and this route's `loading.tsx` is that
// boundary, so calling it in the main component pushed the ENTIRE index to
// client-side rendering. That is why prod served nav + footer with zero links to
// the 41 detail pages. Isolating it in a null-rendering child behind its own
// Suspense boundary confines the opt-out to something that renders nothing, and
// lets the grid above it prerender into the HTML.
function CityParamReader({ onCity }: { onCity: (city: string | null) => void }) {
  const searchParams = useSearchParams()
  const city = searchParams.get('city')

  useEffect(() => {
    onCity(city)
  }, [city, onCity])

  return null
}

// ── Pill ──────────────────────────────────────────────────────────────────────

function Pill({
  label, count, active, onClick, compact = false,
}: {
  label: string; count: number; active: boolean; onClick: () => void; compact?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border text-xs font-semibold transition-all duration-150 whitespace-nowrap ${
        compact ? 'px-3 py-1' : 'px-4 py-1.5'
      } ${
        active
          ? 'border-[#1C3829] bg-[#1C3829] text-white'
          : 'border-[#E0DDD8] bg-white text-[#555] hover:border-[#1C3829] hover:text-[#1C3829]'
      }`}
    >
      {label}
      <span className={`ml-1.5 text-[10px] font-normal ${active ? 'text-white/70' : 'text-[#999]'}`}>{count}</span>
    </button>
  )
}

// ── Shared filter styles ──────────────────────────────────────────────────────
//
// Rendered once by the main component so the keyframes exist regardless of which
// pill tiers are on screen. `nbr-fade-in` deliberately animates only opacity and
// transform — animating max-height here would clamp the wrapping city grid and
// let its extra rows spill over the content below it.

function FilterStyles() {
  return (
    <style>{`
      .nbr-pill-row::-webkit-scrollbar { display: none; }
      @keyframes nbr-slide-in {
        from { max-height: 0; opacity: 0; }
        to { max-height: 40px; opacity: 1; }
      }
      @keyframes nbr-fade-in {
        from { opacity: 0; transform: translateY(-4px); }
        to { opacity: 1; transform: none; }
      }
    `}</style>
  )
}

// ── Scrollable pill row with fade mask (NBR-08) ───────────────────────────────

function PillRow({ children, animate = false }: { children: React.ReactNode; animate?: boolean }) {
  return (
    <div
      className="relative overflow-hidden"
      style={animate ? { animation: 'nbr-slide-in 160ms ease-out both' } : undefined}
    >
      <div
        className="nbr-pill-row flex gap-2 overflow-x-auto pb-0.5"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {children}
      </div>
      {/* 24px right-edge fade mask */}
      <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-[#FAF9F6]" />
    </div>
  )
}

// ── City tier: pills with collapse / "Show all" expander ──────────────────────
//
// The index scopes to a single province (usually BC), which can span dozens of
// cities. The collapsed row shows the top cities by neighbourhood count; the
// full alphabetical list is one tap away — no search box.

function CityFilter({
  cityOptions,
  selectedCity,
  onSelect,
  allLabel,
  allCount,
  compact = false,
}: {
  cityOptions: FilterOption[]
  selectedCity: string
  onSelect: (key: string) => void
  allLabel: string
  allCount: number
  compact?: boolean
}) {
  const [expanded, setExpanded] = useState(false)

  const byCount = useMemo(
    () => [...cityOptions].sort((a, b) => b.count - a.count || a.label.localeCompare(b.label)),
    [cityOptions],
  )
  const alpha = useMemo(
    () => [...cityOptions].sort((a, b) => a.label.localeCompare(b.label)),
    [cityOptions],
  )

  const collapsed = byCount.slice(0, COLLAPSED_CITY_LIMIT)
  const hiddenCount = cityOptions.length - collapsed.length
  const visible = expanded ? alpha : collapsed

  return (
    <div
      // Expanded, the full city list runs to five rows — on a narrow viewport that
      // would fill the sticky bar with the whole screen, so cap it and let it scroll.
      className={`flex flex-wrap items-center gap-2 ${expanded ? 'max-h-[45vh] overflow-y-auto' : ''}`}
      style={{ animation: 'nbr-fade-in 160ms ease-out both' }}
    >
      <Pill
        label={allLabel}
        count={allCount}
        active={selectedCity === ALL_CITIES}
        onClick={() => onSelect(ALL_CITIES)}
        compact={compact}
      />
      {visible.map((opt) => (
        <Pill
          key={opt.key}
          label={opt.label}
          count={opt.count}
          active={selectedCity === opt.key}
          onClick={() => onSelect(opt.key)}
          compact={compact}
        />
      ))}
      {expanded ? (
        <button
          onClick={() => setExpanded(false)}
          className="whitespace-nowrap px-2 py-1 text-xs font-semibold text-[#1C3829] hover:underline"
        >
          ‹ Collapse
        </button>
      ) : (
        hiddenCount > 0 && (
          <button
            onClick={() => setExpanded(true)}
            className="whitespace-nowrap px-2 py-1 text-xs font-semibold text-[#1C3829] hover:underline"
          >
            Show all {cityOptions.length} ›
          </button>
        )
      )}
    </div>
  )
}

// ── Search bar with autocomplete ──────────────────────────────────────────────

function SearchBar({
  query,
  onChange,
  isOpen,
  onFocus,
  onClose,
  neighbourhoodMatches,
  cityMatches,
  onPickNeighbourhood,
  onPickCity,
}: {
  query: string
  onChange: (value: string) => void
  isOpen: boolean
  onFocus: () => void
  onClose: () => void
  neighbourhoodMatches: Neighbourhood[]
  cityMatches: CityMatch[]
  onPickNeighbourhood: (n: Neighbourhood) => void
  onPickCity: (c: CityMatch) => void
}) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!isOpen) return
    function onPointerDown(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) onClose()
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose()
        inputRef.current?.blur()
      }
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [isOpen, onClose])

  const hasMatches = neighbourhoodMatches.length > 0 || cityMatches.length > 0
  const showDropdown = isOpen && query.trim().length > 0

  return (
    <div ref={wrapRef} className="relative max-w-[460px] mb-6">
      <div
        className={`flex items-center gap-2.5 bg-white rounded-2xl border px-4 py-3.5 transition-colors ${
          isOpen ? 'border-[#1C3829]' : 'border-[#E0DDD8]'
        }`}
      >
        <Search size={17} className="text-[#1C3829] flex-shrink-0" />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => onChange(e.target.value)}
          onFocus={onFocus}
          placeholder="Search by name or city — &quot;Kitsilano&quot;, &quot;Surrey&quot;"
          className="w-full bg-transparent text-sm text-[#111111] placeholder:text-[#999] outline-none"
        />
        {query && (
          <button
            onClick={() => {
              onChange('')
              inputRef.current?.focus()
            }}
            aria-label="Clear search"
            className="flex-shrink-0 text-[#A9A69C] hover:text-[#555] transition-colors"
          >
            <X size={15} />
          </button>
        )}
      </div>

      {showDropdown && hasMatches && (
        <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-30 bg-white border border-[#E8E6E1] rounded-2xl p-1.5 shadow-lg">
          {neighbourhoodMatches.length > 0 && (
            <>
              <p className="px-2.5 pt-1.5 pb-1 text-[9.5px] font-bold uppercase tracking-wider text-[#A9A69C]">
                Neighbourhoods
              </p>
              {neighbourhoodMatches.map((n) => (
                <button
                  key={n.slug}
                  onClick={() => onPickNeighbourhood(n)}
                  className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-sm text-[#111111] hover:bg-[#F5F3EE] transition-colors text-left"
                >
                  <span>{n.name}</span>
                  <span className="text-xs text-[#6B6B6B]">
                    {n.city}, {n.province}
                  </span>
                </button>
              ))}
            </>
          )}
          {cityMatches.length > 0 && (
            <>
              <p className="px-2.5 pt-2 pb-1 text-[9.5px] font-bold uppercase tracking-wider text-[#A9A69C]">
                Cities
              </p>
              {cityMatches.map((c) => (
                <button
                  key={`${c.province}|${c.city}`}
                  onClick={() => onPickCity(c)}
                  className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-sm text-[#111111] hover:bg-[#F5F3EE] transition-colors text-left"
                >
                  <span>{c.city}</span>
                  <span className="text-xs text-[#6B6B6B]">
                    {c.count} neighbourhood{c.count === 1 ? '' : 's'}
                  </span>
                </button>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function NeighbourhoodsClient({
  all,
  children,
}: {
  all: Neighbourhood[]
  /** SEO-02: the server-rendered default grid. Rendered as-is while the view is
   *  in its initial state, so the anchors in the HTML are the ones the visitor
   *  sees — the client only takes over the grid once a filter or search runs. */
  children: React.ReactNode
}) {
  const router = useRouter()
  const query = useSearchStore((s) => s.query)
  const userCity = useSearchStore((s) => s.userCity)

  // Index shows genuine neighbourhoods only — see browsableNeighbourhoods. The
  // server page derives the default grid from the same helper.
  const data = useMemo(() => browsableNeighbourhoods(all), [all])

  const initialProvince = useMemo(() => defaultProvince(data), [data])
  const [selectedProvince, setSelectedProvince] = useState(initialProvince)
  const [selectedCity, setSelectedCity] = useState(ALL_CITIES)
  const [isSticky, setIsSticky] = useState(false)
  const sentinelRef = useRef<HTMLDivElement>(null)

  // ── Search ──────────────────────────────────────────────────────────────
  const [searchText, setSearchText] = useState('')
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const searchActive = searchText.trim().length > 0

  const searchResults = useMemo(
    () => rankByQuery(matchNeighbourhoods(data, searchText), searchText),
    [data, searchText],
  )
  const searchNeighbourhoodOptions = useMemo(
    () => searchResults.slice(0, SEARCH_NEIGHBOURHOOD_LIMIT),
    [searchResults],
  )
  const searchCityOptions = useMemo(
    () => matchCities(data, searchText).slice(0, SEARCH_CITY_LIMIT),
    [data, searchText],
  )

  function handlePickNeighbourhood(n: Neighbourhood) {
    setIsSearchOpen(false)
    router.push(`/neighbourhoods/${n.slug}`)
  }

  function handlePickCity(c: CityMatch) {
    setSelectedProvince(c.province)
    setSelectedCity(c.city)
    setSearchText('')
    setIsSearchOpen(false)
  }

  // NBR-03: context-aware pre-selection, applied once. An explicit `?city=` param
  // (e.g. from the homepage "Understand the vicinity" cards) wins over the ambient
  // search-store query/userCity. The param arrives from <CityParamReader> rather
  // than a direct useSearchParams call — see the note on that component.
  const contextApplied = useRef(false)
  const applyContext = useCallback(
    (cityParam: string | null) => {
      if (contextApplied.current) return
      contextApplied.current = true
      const ctx = contextMatch(data, cityParam || query, userCity)
      if (ctx) {
        setSelectedProvince(ctx.province)
        setSelectedCity(ctx.city)
      }
    },
    [data, query, userCity],
  )

  // NBR-07: detect when filter bar is in sticky state
  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => setIsSticky(!entry.isIntersecting),
      { threshold: 1, rootMargin: '-1px 0px 0px 0px' },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const { provinceOptions, cityOptions } = useMemo(
    () => deriveFilters(data, selectedProvince),
    [data, selectedProvince],
  )

  const multiProvince = provinceOptions.length > 2
  // City tier: shown when the province has more than one city to pick from.
  const showCityFilter = selectedProvince !== 'all' && cityOptions.length > 1
  // NBR-05: hide city tag when a specific city is selected
  const showCityTag = selectedCity === ALL_CITIES

  const filtered = useMemo(
    () => filterNeighbourhoods(data, selectedProvince, selectedCity),
    [data, selectedProvince, selectedCity],
  )

  // SEO-02: while nothing has been filtered or searched, keep showing the grid the
  // server rendered instead of re-rendering an identical one on the client. This
  // is the state a crawler (and every cold page load) sees.
  const isDefaultView =
    !searchActive && selectedProvince === initialProvince && selectedCity === ALL_CITIES

  const provinceLabel = PROVINCE_LABELS[selectedProvince] ?? selectedProvince
  const cityAllCount = useMemo(
    () => filterNeighbourhoods(data, selectedProvince, ALL_CITIES).length,
    [data, selectedProvince],
  )

  function selectProvince(key: string) {
    setSelectedProvince(key)
    setSelectedCity(ALL_CITIES)
    setSearchText('')
  }

  function selectCity(key: string) {
    setSelectedCity(key)
    setSearchText('')
  }

  if (data.length === 0) {
    return (
      <div className="py-24 text-center">
        <div className="w-12 h-12 rounded-full bg-[#F2F0EB] flex items-center justify-center mx-auto mb-4">
          <span className="text-xl">🏘</span>
        </div>
        <p className="font-heading text-lg font-semibold text-[#111111] mb-1">No neighbourhoods available yet</p>
        <p className="text-sm text-[#6B6B6B] max-w-xs mx-auto">
          We&apos;re curating Canada&apos;s finest enclaves — check back soon.
        </p>
      </div>
    )
  }

  // NBR-06: empty state data
  const activeCity = selectedCity !== ALL_CITIES ? selectedCity : null
  const activeProvince = selectedProvince !== 'all' ? selectedProvince : null

  return (
    <>
      <FilterStyles />

      <Suspense fallback={null}>
        <CityParamReader onCity={applyContext} />
      </Suspense>

      <SearchBar
        query={searchText}
        onChange={setSearchText}
        isOpen={isSearchOpen}
        onFocus={() => setIsSearchOpen(true)}
        onClose={() => setIsSearchOpen(false)}
        neighbourhoodMatches={searchNeighbourhoodOptions}
        cityMatches={searchCityOptions}
        onPickNeighbourhood={handlePickNeighbourhood}
        onPickCity={handlePickCity}
      />

      {/* Sentinel for sticky detection */}
      <div ref={sentinelRef} />

      {/* NBR-07: Sticky filter bar with blur backdrop */}
      <div
        className={`sticky top-0 z-20 -mx-4 sm:-mx-6 px-4 sm:px-6 pt-3 pb-3 transition-shadow duration-200 ${
          isSticky
            ? 'border-b border-[#E8E6E1] [background:rgba(250,249,246,0.94)] [backdrop-filter:blur(8px)]'
            : ''
        }`}
      >
        {/* Level 1: Province pills */}
        {multiProvince && (
          <div className="mb-2">
            <PillRow>
              {provinceOptions.map((opt) => (
                <Pill
                  key={opt.key}
                  label={opt.label}
                  count={opt.count}
                  active={selectedProvince === opt.key}
                  onClick={() => selectProvince(opt.key)}
                  compact={isSticky}
                />
              ))}
            </PillRow>
          </div>
        )}

        {/* Level 2: City pills with "Show all" expander */}
        {showCityFilter && (
          <CityFilter
            cityOptions={cityOptions}
            selectedCity={selectedCity}
            onSelect={selectCity}
            allLabel={`All ${provinceLabel}`}
            allCount={cityAllCount}
            compact={isSticky}
          />
        )}
      </div>

      {/* Search-mode grid: overrides the province/city pill filtering entirely */}
      {searchActive ? (
        searchResults.length === 0 ? (
          <div className="mt-8 rounded-2xl border-2 border-dashed border-[#E0DDD8] px-6 py-12 text-center">
            <p className="font-heading text-lg font-semibold text-[#111111] mb-1">
              No matches for &ldquo;{searchText.trim()}&rdquo;
            </p>
            <p className="text-sm text-[#6B6B6B] mb-6">
              Try a different name or city, or browse the full list instead.
            </p>
            <button
              onClick={() => setSearchText('')}
              className="rounded-full border border-[#1C3829] px-4 py-1.5 text-xs font-semibold text-[#1C3829] hover:bg-[#1C3829] hover:text-white transition-colors"
            >
              Clear search
            </button>
          </div>
        ) : (
          <>
            <p className="mt-2 mb-4 text-[11px] font-bold uppercase tracking-widest text-[#1C3829]">
              Results for &ldquo;{searchText.trim()}&rdquo;
              <span className="ml-2 text-[#999] font-normal normal-case tracking-normal">
                {searchResults.length}
              </span>
            </p>
            <NeighbourhoodGrid neighbourhoods={searchResults} showCityTag />
          </>
        )
      ) : activeCity && filtered.length === 0 ? (
        <div className="mt-8 rounded-2xl border-2 border-dashed border-[#E0DDD8] px-6 py-12 text-center">
          <p className="font-heading text-lg font-semibold text-[#111111] mb-1">
            No neighbourhoods in {activeCity} yet
          </p>
          <p className="text-sm text-[#6B6B6B] mb-6">
            We&apos;re expanding our coverage — check back soon.
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            {activeProvince && (
              <button
                onClick={() => setSelectedCity(ALL_CITIES)}
                className="rounded-full border border-[#1C3829] px-4 py-1.5 text-xs font-semibold text-[#1C3829] hover:bg-[#1C3829] hover:text-white transition-colors"
              >
                Browse all {activeProvince}
              </button>
            )}
            {cityOptions
              .filter((c) => c.key !== activeCity && c.count > 0)
              .sort((a, b) => b.count - a.count)
              .slice(0, 3)
              .map((c) => (
                <button
                  key={c.key}
                  onClick={() => setSelectedCity(c.key)}
                  className="rounded-full border border-[#E0DDD8] bg-white px-4 py-1.5 text-xs font-semibold text-[#555] hover:border-[#1C3829] hover:text-[#1C3829] transition-colors"
                >
                  See {c.label}
                </button>
              ))}
          </div>
        </div>
      ) : (
        <>
          {/* Grid */}
          <p className="mt-2 mb-4 text-[11px] font-bold uppercase tracking-widest text-[#1C3829]">
            All Neighbourhoods
            <span className="ml-2 text-[#999] font-normal normal-case tracking-normal">{filtered.length}</span>
          </p>
          {isDefaultView ? (
            children
          ) : (
            <NeighbourhoodGrid neighbourhoods={filtered} showCityTag={showCityTag} />
          )}
        </>
      )}
    </>
  )
}
