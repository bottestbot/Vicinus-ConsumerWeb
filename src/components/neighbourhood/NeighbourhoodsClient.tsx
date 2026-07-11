'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useSearchStore } from '@/store/searchStore'
import type { Neighbourhood } from '@/types/neighbourhood'
import { formatPrice } from '@/types/search'
import { EDITORIAL_FEATURED_SLUGS } from '@/lib/neighbourhood-regions'
import { getNeighbourhoodMapImageUrl } from '@/lib/neighbourhood-images'

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1548656848-c80e1d02d05a?w=800&q=80'

const ALL_CITIES = 'all-cities'
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

function filterNeighbourhoods(all: Neighbourhood[], province: string, city: string): Neighbourhood[] {
  let result = all
  if (province !== 'all') result = result.filter((n) => n.province === province)
  if (city !== ALL_CITIES) result = result.filter((n) => n.city === city)
  return result
}

// ── NBR-02: default province ──────────────────────────────────────────────────

function defaultProvince(all: Neighbourhood[]): string {
  const provinces = [...new Set(all.map((n) => n.province))]
  if (provinces.length === 1) return provinces[0]
  if (provinces.includes('BC')) return 'BC'
  const counts = new Map<string, number>()
  for (const n of all) counts.set(n.province, (counts.get(n.province) ?? 0) + 1)
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'all'
}

// ── NBR-03: context-aware selection ──────────────────────────────────────────

function contextMatch(all: Neighbourhood[], query: string | null, userCity: string | null): { province: string; city: string } | null {
  const q = (query || userCity || '').toLowerCase().trim()
  if (!q) return null
  const match = all.find((n) => n.city.toLowerCase() === q)
  if (match) return { province: match.province, city: match.city }
  return null
}

// ── NBR-04: featured label ────────────────────────────────────────────────────

function buildFeaturedLabel(province: string, city: string): string {
  if (city !== ALL_CITIES) return city
  if (province !== 'all') return `${PROVINCE_LABELS[province] ?? province} Highlights`
  return "Editor's Picks"
}

function pickFeatured(all: Neighbourhood[], province: string, city: string): Neighbourhood[] {
  const filtered = filterNeighbourhoods(all, province, city)
  if (filtered.length >= 2) return filtered.slice(0, 5)
  return EDITORIAL_FEATURED_SLUGS
    .map((slug) => all.find((n) => n.slug === slug))
    .filter((n): n is Neighbourhood => Boolean(n))
}

// ── Cards ─────────────────────────────────────────────────────────────────────

// NBR-05: showCityTag is false when a specific city is selected
function NeighbourhoodCard({ neighbourhood, showCityTag }: { neighbourhood: Neighbourhood; showCityTag: boolean }) {
  const imageSrc =
    neighbourhood.lat && neighbourhood.lng
      ? getNeighbourhoodMapImageUrl(neighbourhood.lat, neighbourhood.lng)
      : FALLBACK_IMAGE

  return (
    <Link href={`/neighbourhoods/${neighbourhood.slug}`} className="group">
      <article className="bg-white rounded-2xl border border-[#E8E6E1] overflow-hidden hover:border-[#1C3829]/40 hover:shadow-lg transition-all duration-300">
        <div className="relative h-52 overflow-hidden bg-[#F2F0EB]">
          <Image
            src={imageSrc}
            alt={neighbourhood.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          <div className="absolute bottom-4 left-4 right-4">
            <p className="font-heading text-xl font-bold text-white leading-tight">{neighbourhood.name}</p>
            {showCityTag && (
              <p className="text-xs text-white/70 mt-0.5">{neighbourhood.city}</p>
            )}
          </div>
        </div>
        <div className="p-4 flex items-center justify-between">
          <p className="text-sm text-[#6B6B6B]">
            {neighbourhood.city},{' '}
            <span className="font-medium text-[#111111]">{neighbourhood.province}</span>
          </p>
          {neighbourhood.medianPrice && (
            <p className="text-sm font-semibold text-[#111111]">
              {formatPrice(neighbourhood.medianPrice)}
              <span className="text-[10px] text-[#6B6B6B] font-normal ml-0.5">med.</span>
            </p>
          )}
        </div>
      </article>
    </Link>
  )
}

function SpotlightCard({ neighbourhood, large = false }: { neighbourhood: Neighbourhood; large?: boolean }) {
  const imageSrc = neighbourhood.imageUrl ?? FALLBACK_IMAGE
  return (
    <Link href={`/neighbourhoods/${neighbourhood.slug}`} className="group relative block rounded-2xl overflow-hidden cursor-pointer h-full">
      <Image
        src={imageSrc}
        alt={neighbourhood.name}
        fill
        sizes={large ? '(max-width: 768px) 100vw, 50vw' : '(max-width: 768px) 100vw, 25vw'}
        className="object-cover transition-transform duration-500 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <p className={`font-heading font-bold text-white leading-tight ${large ? 'text-2xl' : 'text-base'}`}>
          {neighbourhood.name}
        </p>
        {neighbourhood.medianPrice && (
          <p className="mt-0.5 text-xs text-white/75">{formatPrice(neighbourhood.medianPrice)} med.</p>
        )}
      </div>
    </Link>
  )
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

// ── Scrollable pill row with fade mask (NBR-08) ───────────────────────────────

function PillRow({ children, animate = false }: { children: React.ReactNode; animate?: boolean }) {
  return (
    <div
      className="relative overflow-hidden"
      style={animate ? { animation: 'nbr-slide-in 160ms ease-out both' } : undefined}
    >
      <div className="flex gap-2 overflow-x-auto pb-0.5" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        <style>{`
          .nbr-pill-row::-webkit-scrollbar { display: none; }
          @keyframes nbr-slide-in {
            from { max-height: 0; opacity: 0; }
            to { max-height: 40px; opacity: 1; }
          }
        `}</style>
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
    <div className="flex flex-wrap gap-2" style={{ animation: 'nbr-slide-in 160ms ease-out both' }}>
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

// ── Main component ────────────────────────────────────────────────────────────

export default function NeighbourhoodsClient({ all }: { all: Neighbourhood[] }) {
  const query = useSearchStore((s) => s.query)
  const userCity = useSearchStore((s) => s.userCity)

  // Index shows genuine neighbourhoods only. Rows where name === city are bare
  // municipalities (seeded so cities are searchable); they aren't places to
  // browse into, so they're excluded here. Also dedupe by name+city to guard
  // against legacy duplicate rows (e.g. kitsilano / kitsilano-vancouver).
  const data = useMemo(() => {
    const seen = new Set<string>()
    const out: Neighbourhood[] = []
    for (const n of all) {
      if (n.name === n.city) continue
      const key = `${n.province}|${n.city}|${n.name}`.toLowerCase()
      if (seen.has(key)) continue
      seen.add(key)
      out.push(n)
    }
    return out
  }, [all])

  const initialProvince = useMemo(() => defaultProvince(data), [data])
  const [selectedProvince, setSelectedProvince] = useState(initialProvince)
  const [selectedCity, setSelectedCity] = useState(ALL_CITIES)
  const [isSticky, setIsSticky] = useState(false)
  const sentinelRef = useRef<HTMLDivElement>(null)

  // NBR-03: context-aware pre-selection on mount
  useEffect(() => {
    const ctx = contextMatch(data, query, userCity)
    if (ctx) {
      setSelectedProvince(ctx.province)
      setSelectedCity(ctx.city)
    }
  }, []) // intentionally run once on mount

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

  const featured = useMemo(
    () => pickFeatured(data, selectedProvince, selectedCity),
    [data, selectedProvince, selectedCity],
  )

  const featLabel = buildFeaturedLabel(selectedProvince, selectedCity)
  const provinceLabel = PROVINCE_LABELS[selectedProvince] ?? selectedProvince
  const cityAllCount = useMemo(
    () => filterNeighbourhoods(data, selectedProvince, ALL_CITIES).length,
    [data, selectedProvince],
  )

  function selectProvince(key: string) {
    setSelectedProvince(key)
    setSelectedCity(ALL_CITIES)
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
            onSelect={setSelectedCity}
            allLabel={`All ${provinceLabel}`}
            allCount={cityAllCount}
            compact={isSticky}
          />
        )}
      </div>

      {/* NBR-06: Empty state when selected city has no neighbourhoods */}
      {activeCity && filtered.length === 0 ? (
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
          {/* NBR-04: Adaptive featured section */}
          {featured.length >= 2 && (
            <section className="mt-6 mb-10">
              <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-[#1C3829]">
                {featLabel}
              </p>
              <div
                className="grid gap-3"
                style={{
                  gridTemplateColumns: featured.length >= 3 ? '1fr 1fr' : '1fr',
                  gridTemplateRows: featured.length >= 3 ? 'repeat(2, 160px)' : '280px',
                }}
              >
                <div className="row-span-2 min-h-[320px]">
                  <SpotlightCard neighbourhood={featured[0]} large />
                </div>
                {featured.slice(1, 5).map((n) => (
                  <SpotlightCard key={n.slug} neighbourhood={n} />
                ))}
              </div>
            </section>
          )}

          {/* Grid */}
          <p className="mb-4 text-[11px] font-bold uppercase tracking-widest text-[#1C3829]">
            All Neighbourhoods
            <span className="ml-2 text-[#999] font-normal normal-case tracking-normal">{filtered.length}</span>
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((n) => (
              <NeighbourhoodCard key={n.slug} neighbourhood={n} showCityTag={showCityTag} />
            ))}
          </div>
        </>
      )}
    </>
  )
}
