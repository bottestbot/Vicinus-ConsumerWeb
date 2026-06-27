'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { Search, X, ChevronDown } from 'lucide-react'
import { getAutocomplete } from '@/lib/api/search'
import type { AutocompleteSuggestion } from '@/types/search'

export interface FeedFilters {
  q: string
  city: string
  listingType: 'For Sale' | 'For Rent' | ''
  maxPrice: number | null
  beds: number | null
  propertyType: string
}

const PRICE_OPTIONS = [
  { label: 'Any price', value: null },
  { label: 'Up to $500K', value: 500_000 },
  { label: 'Up to $750K', value: 750_000 },
  { label: 'Up to $1.0M', value: 1_000_000 },
  { label: 'Up to $1.5M', value: 1_500_000 },
  { label: 'Up to $2M', value: 2_000_000 },
  { label: 'Up to $3M', value: 3_000_000 },
  { label: 'Up to $5M', value: 5_000_000 },
]

const BEDS_OPTIONS = [
  { label: 'Any', value: null },
  { label: '1+', value: 1 },
  { label: '2+', value: 2 },
  { label: '3+', value: 3 },
  { label: '4+', value: 4 },
]

const HOME_TYPE_OPTIONS = [
  { label: 'Any type', value: '' },
  { label: 'Single Family', value: 'Single Family' },
  { label: 'Condo', value: 'Condo' },
  { label: 'Townhouse', value: 'Townhouse' },
  { label: 'Multi-Family', value: 'Multi-Family' },
]

// ─── Generic dropdown popover ──────────────────────────────────────────────────

function Dropdown({
  label,
  active,
  onClear,
  children,
}: {
  label: string
  active?: boolean
  onClear?: () => void
  children: (close: () => void) => React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null)
  const ref = useRef<HTMLDivElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)
  const btnRef = useRef<HTMLButtonElement>(null)

  // Anchor the portal popover to the button (escapes the filter bar's overflow clip)
  const updateCoords = useCallback(() => {
    const r = btnRef.current?.getBoundingClientRect()
    if (r) setCoords({ top: r.bottom + 8, left: r.left })
  }, [])

  useEffect(() => {
    if (!open) return
    updateCoords()
    const handler = (e: MouseEvent) => {
      const t = e.target as Node
      if (!ref.current?.contains(t) && !popoverRef.current?.contains(t)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    window.addEventListener('resize', updateCoords)
    window.addEventListener('scroll', updateCoords, true)
    return () => {
      document.removeEventListener('mousedown', handler)
      window.removeEventListener('resize', updateCoords)
      window.removeEventListener('scroll', updateCoords, true)
    }
  }, [open, updateCoords])

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        ref={btnRef}
        onClick={() => setOpen((o) => !o)}
        className={[
          'inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full text-sm font-medium border whitespace-nowrap transition-colors',
          active
            ? 'bg-[#1C3829] text-white border-[#1C3829]'
            : 'bg-white text-[#111111] border-[#E8E6E1] hover:border-[#1C3829]/40',
        ].join(' ')}
      >
        {label}
        {active && onClear ? (
          <X
            size={12}
            onClick={(e) => {
              e.stopPropagation()
              onClear?.()
              setOpen(false)
            }}
          />
        ) : (
          <ChevronDown size={12} />
        )}
      </button>

      {open && coords && typeof document !== 'undefined' && createPortal(
        <div
          ref={popoverRef}
          style={{ position: 'fixed', top: coords.top, left: coords.left }}
          className="bg-white rounded-xl border border-[#E8E6E1] shadow-xl shadow-black/10 z-[100] min-w-[180px] p-1"
        >
          {children(() => setOpen(false))}
        </div>,
        document.body,
      )}
    </div>
  )
}

function DropdownOption({
  label,
  selected,
  onClick,
}: {
  label: string
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={[
        'w-full text-left px-3 py-2 rounded-lg text-sm transition-colors',
        selected
          ? 'bg-[#1C3829] text-white font-medium'
          : 'text-[#111111] hover:bg-[#F2F0EB]',
      ].join(' ')}
    >
      {label}
    </button>
  )
}

// ─── Main component ────────────────────────────────────────────────────────────

interface Props {
  filters: FeedFilters
  onChange: (f: FeedFilters) => void
}

export default function FeedFilterBar({ filters, onChange }: Props) {
  const [inputValue, setInputValue] = useState(filters.q || filters.city)
  const [suggestions, setSuggestions] = useState<AutocompleteSuggestion[]>([])
  const [suggestOpen, setSuggestOpen] = useState(false)
  const [suggestCoords, setSuggestCoords] = useState<{ top: number; left: number; width: number } | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const searchContainerRef = useRef<HTMLDivElement>(null)

  const updateSuggestCoords = useCallback(() => {
    const r = searchContainerRef.current?.getBoundingClientRect()
    if (r) setSuggestCoords({ top: r.bottom + 6, left: r.left, width: r.width })
  }, [])

  const set = (patch: Partial<FeedFilters>) => onChange({ ...filters, ...patch })

  // Fetch autocomplete suggestions
  const fetchSuggestions = useCallback(async (val: string) => {
    if (!val.trim()) { setSuggestions([]); setSuggestOpen(false); return }
    updateSuggestCoords()
    try {
      const res = await getAutocomplete(val)
      const data = Array.isArray(res.data) ? res.data : []
      setSuggestions(data.slice(0, 6))
      setSuggestOpen(data.length > 0)
    } catch {
      setSuggestions([])
    }
  }, [updateSuggestCoords])

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value
    setInputValue(v)
    fetchSuggestions(v)
  }

  const handleSearchSubmit = () => {
    const parts = inputValue.trim().split(',')
    const city = parts[0]?.trim() ?? ''
    set({ q: inputValue, city })
    setSuggestOpen(false)
    inputRef.current?.blur()
  }

  const handleSuggestionSelect = (s: AutocompleteSuggestion) => {
    setInputValue(s.label)
    set({ q: s.label, city: s.label })
    setSuggestions([])
    setSuggestOpen(false)
    inputRef.current?.blur()
  }

  // Close search dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!searchContainerRef.current?.contains(e.target as Node)) setSuggestOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const priceLabel = filters.maxPrice
    ? PRICE_OPTIONS.find((o) => o.value === filters.maxPrice)?.label ?? `Up to $${(filters.maxPrice / 1_000_000).toFixed(1)}M`
    : 'Any – $1.0M'
  const bedsLabel = filters.beds ? `${filters.beds}+ Beds` : 'Beds & Baths'
  const homeTypeLabel = filters.propertyType || 'Home Type'
  const listingActive = !!filters.listingType

  return (
    <div className="relative z-50 bg-white border-b border-[#E8E6E1] px-4 py-2.5 flex items-center gap-2 overflow-x-auto scrollbar-none">

      {/* Search input */}
      <div ref={searchContainerRef} className="relative shrink-0 w-52">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B6B6B] pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleSearchChange}
          onKeyDown={(e) => e.key === 'Enter' && handleSearchSubmit()}
          onFocus={() => { updateSuggestCoords(); inputValue && fetchSuggestions(inputValue) }}
          placeholder="City or neighbourhood..."
          className="w-full h-9 pl-8 pr-8 text-sm rounded-full border border-[#E8E6E1] bg-white placeholder:text-[#9B9B9B] focus:outline-none focus:border-[#1C3829] transition-colors"
        />
        {inputValue && (
          <button
            onClick={() => { setInputValue(''); set({ q: '', city: '' }); setSuggestOpen(false) }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9B9B9B] hover:text-[#111111]"
          >
            <X size={13} />
          </button>
        )}

        {suggestOpen && suggestions.length > 0 && suggestCoords && typeof document !== 'undefined' && createPortal(
          <ul
            style={{ position: 'fixed', top: suggestCoords.top, left: suggestCoords.left, width: suggestCoords.width }}
            className="bg-white rounded-xl border border-[#E8E6E1] shadow-xl shadow-black/10 z-[100] overflow-hidden"
          >
            {suggestions.map((s) => (
              <li
                key={s.id}
                onMouseDown={() => handleSuggestionSelect(s)}
                className="px-3 py-2 text-sm text-[#111111] hover:bg-[#FAF9F6] cursor-pointer"
              >
                <span className="font-medium">{s.label}</span>
                {s.subtitle && <span className="text-[#6B6B6B] ml-1 text-xs">{s.subtitle}</span>}
              </li>
            ))}
          </ul>,
          document.body,
        )}
      </div>

      {/* Divider */}
      <div className="h-6 w-px bg-[#E8E6E1] shrink-0" />

      {/* Listing type toggle */}
      <Dropdown
        label={filters.listingType || 'For Sale'}
        active={listingActive}
        onClear={() => set({ listingType: '' })}
      >
        {(close) => (
          <>
            {(['For Sale', 'For Rent'] as const).map((v) => (
              <DropdownOption
                key={v}
                label={v}
                selected={filters.listingType === v}
                onClick={() => { set({ listingType: v }); close() }}
              />
            ))}
          </>
        )}
      </Dropdown>

      {/* Price */}
      <Dropdown
        label={priceLabel}
        active={!!filters.maxPrice}
        onClear={() => set({ maxPrice: null })}
      >
        {(close) => (
          <>
            {PRICE_OPTIONS.map((o) => (
              <DropdownOption
                key={String(o.value)}
                label={o.label}
                selected={filters.maxPrice === o.value}
                onClick={() => { set({ maxPrice: o.value }); close() }}
              />
            ))}
          </>
        )}
      </Dropdown>

      {/* Beds */}
      <Dropdown
        label={bedsLabel}
        active={!!filters.beds}
        onClear={() => set({ beds: null })}
      >
        {(close) => (
          <>
            {BEDS_OPTIONS.map((o) => (
              <DropdownOption
                key={String(o.value)}
                label={o.label}
                selected={filters.beds === o.value}
                onClick={() => { set({ beds: o.value }); close() }}
              />
            ))}
          </>
        )}
      </Dropdown>

      {/* Home type */}
      <Dropdown
        label={homeTypeLabel}
        active={!!filters.propertyType}
        onClear={() => set({ propertyType: '' })}
      >
        {(close) => (
          <>
            {HOME_TYPE_OPTIONS.map((o) => (
              <DropdownOption
                key={o.value}
                label={o.label}
                selected={filters.propertyType === o.value}
                onClick={() => { set({ propertyType: o.value }); close() }}
              />
            ))}
          </>
        )}
      </Dropdown>
    </div>
  )
}
