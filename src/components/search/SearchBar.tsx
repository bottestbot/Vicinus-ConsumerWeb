'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Search, X, MapPin, Building2, Home, Navigation } from 'lucide-react'
import { useSearchStore } from '@/store/searchStore'
import { getAutocomplete } from '@/lib/api/search'
import { geocodeCity, geocodeAddress, parseAddress } from '@/lib/geocode'
import { track } from '@/lib/analytics/capture'
import type { AutocompleteSuggestion } from '@/types/search'
import { glass, type GlassTheme } from './glassTheme'

const TYPE_ICONS = {
  city: MapPin,
  neighbourhood: Navigation,
  address: Home,
  postal: Building2,
}

interface SearchBarProps {
  onSearch?: (query: string) => void
  placeholder?: string
  className?: string
  theme?: GlassTheme
}

export default function SearchBar({
  onSearch,
  placeholder = 'Search by neighbourhood, city, or address...',
  className = '',
  theme = 'dark',
}: SearchBarProps) {
  const { query, setQuery, setSelectedCity, setGeocodedCenter, setViewMode } = useSearchStore()
  const t = glass(theme)
  const [inputValue, setInputValue] = useState(query)
  const [suggestions, setSuggestions] = useState<AutocompleteSuggestion[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Debounced live autocomplete from the BE (cities + seeded neighbourhoods).
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const reqIdRef = useRef(0)

  const fetchSuggestions = useCallback((value: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!value.trim()) {
      setSuggestions([])
      setIsOpen(false)
      return
    }
    const reqId = ++reqIdRef.current
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await getAutocomplete(value)
        // Ignore out-of-order responses from earlier keystrokes.
        if (reqId !== reqIdRef.current) return
        const data = (res.data ?? []) as AutocompleteSuggestion[]
        setSuggestions(data)
        setIsOpen(data.length > 0)
        setActiveIndex(-1)
      } catch {
        if (reqId !== reqIdRef.current) return
        setSuggestions([])
        setIsOpen(false)
      }
    }, 180)
  }, [])

  useEffect(() => () => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value
    setInputValue(v)
    // Typing after a suggestion was picked means the user is no longer
    // searching that exact suggestion — drop its resolved city so a stale
    // selection doesn't silently override the new free-text query.
    setSelectedCity(null)
    fetchSuggestions(v)
  }

  // Two-step zoom for a raw typed query: fly to the city instantly (fast,
  // cached lookup), then refine to the exact address once Mapbox resolves it.
  // Autocomplete only ever suggests cities/neighbourhoods (never street
  // addresses — see search.service.ts), so this only fires for a query the
  // user typed and submitted directly, not a picked suggestion.
  // `geocodeQuery` disambiguates same-named places (e.g. "Ambleside" exists in
  // both West Vancouver and Calgary) — it's `value` qualified with the
  // suggestion's own city/province context. Mapbox is only ever queried with
  // this qualified string; `value` alone stays the display label.
  const flyToQuery = (value: string, geocodeQuery: string = value) => {
    if (parseAddress(value).isFullAddress) {
      // A street address only has anywhere to zoom in the Map split-pane — the
      // Feed has no map at all — so force it even if the user switched away.
      setViewMode('both')
      // geocodeCity fuzzy-matches the city out of the raw string on its own
      // (Mapbox tokenizes it), so it's the instant coarse zoom; geocodeAddress
      // refines to the exact pin once it resolves. Both requests fire
      // concurrently, so the network can return either one first — a late
      // city response must never clobber an address zoom that already landed,
      // so gate it behind this flag rather than relying on request order.
      let addressResolved = false
      geocodeAddress(geocodeQuery).then((coords) => {
        if (!coords) return
        addressResolved = true
        setGeocodedCenter({ ...coords, zoom: 16 })
      })
      geocodeCity(geocodeQuery).then((coords) => {
        if (coords && !addressResolved) setGeocodedCenter(coords)
      })
    } else {
      // A city/neighbourhood search works in either view, so leave the user
      // wherever they are — Map (the default) or Feed if they switched.
      geocodeCity(geocodeQuery).then((coords) => { if (coords) setGeocodedCenter(coords) })
    }
  }

  // Shared by the explicit search button and the Enter key (below) — typing a
  // full address and expecting a suggestion to tap doesn't work (autocomplete
  // never suggests street addresses), so there needs to be an unambiguous way
  // to submit the raw typed text, not just Enter (unreliable from mobile
  // on-screen "search" keys on a bare input with no wrapping <form>).
  const handleSubmit = () => {
    setQuery(inputValue)
    setIsOpen(false)
    onSearch?.(inputValue)
    flyToQuery(inputValue)
    inputRef.current?.blur()
    track('search_performed', { query: inputValue })
  }

  const handleSelect = (s: AutocompleteSuggestion) => {
    setInputValue(s.label)
    setQuery(s.label)
    // A city/neighbourhood suggestion's own city (e.g. "Surrey" for "South
    // Surrey") is what DDF can actually filter on — the display label often
    // isn't (a sub-area name, or a "Name / City, Province" compound string).
    setSelectedCity(s.city ?? null)
    setSuggestions([])
    setIsOpen(false)
    onSearch?.(s.label)
    inputRef.current?.blur()
    // Geocode immediately so the map flies before DDF responds. Qualify with
    // the suggestion's own city/subtitle so Mapbox doesn't resolve a bare
    // neighbourhood name (e.g. "Ambleside") to a same-named place in another
    // province — the label alone is ambiguous nationally, this isn't.
    const geocodeQuery = s.city
      ? `${s.label}, ${s.city}`
      : s.subtitle
      ? `${s.label}, ${s.subtitle}`
      : s.label
    flyToQuery(s.label, geocodeQuery)
    track('autocomplete_selected', { query: inputValue, selection: s.label })
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Enter must submit whether or not a dropdown is showing — a typed
    // address with no matching suggestion (autocomplete never suggests street
    // addresses) leaves isOpen false, so this can't be gated on it like the
    // arrow-key/Escape dropdown navigation below is.
    if (e.key === 'Enter') {
      e.preventDefault()
      if (isOpen && activeIndex >= 0) {
        handleSelect(suggestions[activeIndex])
      } else {
        handleSubmit()
      }
      return
    }
    if (!isOpen) return
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setActiveIndex((i) => Math.max(i - 1, -1))
        break
      case 'Escape':
        setIsOpen(false)
        setActiveIndex(-1)
        inputRef.current?.blur()
        break
    }
  }

  const handleClear = () => {
    setInputValue('')
    setQuery('')
    setSelectedCity(null)
    setSuggestions([])
    setIsOpen(false)
    inputRef.current?.focus()
  }

  // Reflect external store changes (e.g. URL hydration) into the input box.
  // `query` only changes on submit/select — not per keystroke — so this won't
  // clobber in-progress typing.
  useEffect(() => {
    setInputValue(query)
  }, [query])

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative flex items-center">
        <button
          type="button"
          onClick={handleSubmit}
          className={`absolute left-2.5 p-0.5 transition-colors ${t.icon} ${t.iconHover}`}
          aria-label="Search"
        >
          <Search size={15} />
        </button>
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => inputValue && fetchSuggestions(inputValue)}
          placeholder={placeholder}
          className={[
            'w-full h-9 pl-9 pr-8 text-sm rounded-lg',
            t.input,
            'focus:outline-none transition-colors font-ui',
          ].join(' ')}
          id="search-input"
          aria-label="Search location"
          aria-autocomplete="list"
          aria-expanded={isOpen}
          aria-controls="search-suggestions"
          aria-haspopup="listbox"
          role="combobox"
        />
        {inputValue && (
          <button
            onClick={handleClear}
            className={`absolute right-2.5 transition-colors ${t.icon} ${t.iconHover}`}
            aria-label="Clear search"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Autocomplete dropdown */}
      {isOpen && suggestions.length > 0 && (
        <ul
          id="search-suggestions"
          role="listbox"
          className={[
            'absolute top-full mt-1.5 w-full rounded-xl z-50 overflow-hidden',
            t.surface,
          ].join(' ')}
        >
          {suggestions.map((s, i) => {
            const Icon = TYPE_ICONS[s.type] ?? MapPin
            return (
              <li
                key={s.id}
                role="option"
                aria-selected={i === activeIndex}
                onMouseDown={() => handleSelect(s)}
                onMouseEnter={() => setActiveIndex(i)}
                className={[
                  'flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors',
                  i === activeIndex ? t.hoverRow : t.rowHover,
                ].join(' ')}
              >
                <Icon size={14} className={`shrink-0 ${t.icon}`} />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${t.text}`}>{s.label}</p>
                  {s.subtitle && (
                    <p className={`text-xs truncate ${t.textMuted}`}>{s.subtitle}</p>
                  )}
                </div>
                <span className={`text-[10px] capitalize shrink-0 ${t.textFaint}`}>{s.type}</span>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
