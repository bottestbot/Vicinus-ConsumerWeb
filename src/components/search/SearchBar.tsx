'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Search, X, MapPin, Building2, Home, Navigation } from 'lucide-react'
import { useSearchStore } from '@/store/searchStore'
import { getAutocomplete } from '@/lib/api/search'
import { geocodeCity } from '@/lib/geocode'
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
  const { query, setQuery, setGeocodedCenter } = useSearchStore()
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
    fetchSuggestions(v)
  }

  const handleSelect = (s: AutocompleteSuggestion) => {
    setInputValue(s.label)
    setQuery(s.label)
    setSuggestions([])
    setIsOpen(false)
    onSearch?.(s.label)
    inputRef.current?.blur()
    // Geocode immediately so the map flies before DDF responds
    geocodeCity(s.label).then((coords) => { if (coords) setGeocodedCenter(coords) })
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
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
      case 'Enter':
        e.preventDefault()
        if (activeIndex >= 0) {
          handleSelect(suggestions[activeIndex])
        } else {
          setQuery(inputValue)
          setIsOpen(false)
          onSearch?.(inputValue)
          geocodeCity(inputValue).then((coords) => { if (coords) setGeocodedCenter(coords) })
        }
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
        <Search
          size={15}
          className={`absolute left-3 pointer-events-none ${t.icon}`}
        />
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
