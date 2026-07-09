'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Search, MapPin, X } from 'lucide-react'
import { getAutocomplete } from '@/lib/api/search'
import type { AutocompleteSuggestion } from '@/types/search'

export default function HeroSearchBar() {
  const router = useRouter()
  const [inputValue, setInputValue] = useState('')
  const [suggestions, setSuggestions] = useState<AutocompleteSuggestion[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const [priceRange, setPriceRange] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const reqIdRef = useRef(0)

  const fetchSuggestions = useCallback((value: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!value.trim()) { setSuggestions([]); setIsOpen(false); return }
    const reqId = ++reqIdRef.current
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await getAutocomplete(value)
        if (reqId !== reqIdRef.current) return
        const data = (res.data ?? []) as AutocompleteSuggestion[]
        setSuggestions(data)
        setIsOpen(data.length > 0)
        setActiveIndex(-1)
      } catch {
        if (reqId !== reqIdRef.current) return
        setSuggestions([]); setIsOpen(false)
      }
    }, 180)
  }, [])

  useEffect(() => () => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
  }, [])

  const handleSelect = (s: AutocompleteSuggestion) => {
    // Only fill the field with the picked location — do NOT navigate.
    // Navigation to /search happens exclusively on Discover (form submit).
    setInputValue(s.label)
    setSuggestions([])
    setIsOpen(false)
    inputRef.current?.focus()
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsOpen(false)
    const params = new URLSearchParams()
    if (inputValue) params.set('q', inputValue)
    if (priceRange) params.set('priceRange', priceRange)
    router.push(`/search?${params}`)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1)) }
    if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIndex((i) => Math.max(i - 1, -1)) }
    if (e.key === 'Enter' && activeIndex >= 0) { e.preventDefault(); handleSelect(suggestions[activeIndex]) }
    if (e.key === 'Escape') { setIsOpen(false); setActiveIndex(-1) }
  }

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setIsOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* Explicit label so the search reads as the hero's primary action (DSGN-01) */}
      <p
        id="hero-search-label"
        className="text-white text-xs sm:text-sm font-semibold uppercase tracking-[0.2em] mb-3"
      >
        Find your home
      </p>
      <form
        onSubmit={handleSubmit}
        aria-labelledby="hero-search-label"
        className="flex flex-col sm:flex-row gap-2 w-full"
      >
      <div ref={containerRef} className="relative flex-1">
        <div className="flex items-center gap-2.5 bg-white/95 backdrop-blur-sm rounded-xl px-5 py-4 shadow-lg">
          <MapPin size={18} className="text-[#9B9B9B] shrink-0" />
          <input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => { setInputValue(e.target.value); fetchSuggestions(e.target.value) }}
            onKeyDown={handleKeyDown}
            onFocus={() => inputValue && fetchSuggestions(inputValue)}
            type="text"
            aria-label="Search by neighbourhood, city, or postal code"
            placeholder="Neighbourhood, City, or Postal Code"
            className="flex-1 text-base text-[#111111] placeholder-[#9B9B9B] bg-transparent focus:outline-none"
            autoComplete="off"
          />
          {inputValue && (
            <button type="button" onClick={() => { setInputValue(''); setSuggestions([]); setIsOpen(false) }}>
              <X size={13} className="text-[#9B9B9B] hover:text-[#111111]" />
            </button>
          )}
        </div>

        {isOpen && suggestions.length > 0 && (
          <ul className="absolute top-full mt-1.5 w-full bg-white rounded-xl border border-[#E8E6E1] shadow-xl z-50 overflow-hidden">
            {suggestions.map((s, i) => (
              <li
                key={s.id}
                onMouseDown={() => handleSelect(s)}
                onMouseEnter={() => setActiveIndex(i)}
                className={[
                  'flex items-center gap-3 px-4 py-2.5 cursor-pointer text-sm',
                  i === activeIndex ? 'bg-[#FAF9F6]' : 'hover:bg-[#FAF9F6]',
                ].join(' ')}
              >
                <MapPin size={13} className="text-[#6B6B6B] shrink-0" />
                <span className="font-medium text-[#111111]">{s.label}</span>
                {s.subtitle && <span className="text-[#9B9B9B] text-xs ml-auto shrink-0">{s.subtitle}</span>}
              </li>
            ))}
          </ul>
        )}
      </div>

      <select
        value={priceRange}
        onChange={(e) => setPriceRange(e.target.value)}
        aria-label="Price range"
        className="sm:w-40 px-4 py-4 bg-white/95 backdrop-blur-sm rounded-xl text-sm text-[#6B6B6B] focus:outline-none cursor-pointer shadow-lg"
      >
        <option value="">Price Range</option>
        <option value="0-1000000">Under $1M</option>
        <option value="1000000-2000000">$1M – $2M</option>
        <option value="2000000-5000000">$2M – $5M</option>
        <option value="5000000-">$5M+</option>
      </select>

      <button
        type="submit"
        className="flex items-center justify-center gap-2 px-7 py-4 bg-[#1C3829] text-white text-base font-semibold rounded-xl hover:bg-[#2D5A3D] transition-colors shrink-0 shadow-lg"
      >
        <Search size={18} />
        Search
      </button>
      </form>
    </div>
  )
}
