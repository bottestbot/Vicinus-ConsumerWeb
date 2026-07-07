'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { MapPin, ArrowRight, Home } from 'lucide-react'
import { searchAddresses, type AddressSuggestion } from '@/lib/geocode'

export default function SellIntro({ onExplore }: { onExplore: (address: string) => void }) {
  const [address, setAddress] = useState('')
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)

  // Debounced Mapbox address autocomplete (mirrors SearchBar's pattern).
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
      const data = await searchAddresses(value)
      // Ignore out-of-order responses from earlier keystrokes.
      if (reqId !== reqIdRef.current) return
      setSuggestions(data)
      setIsOpen(data.length > 0)
      setActiveIndex(-1)
    }, 180)
  }, [])

  useEffect(() => () => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
  }, [])

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value
    setAddress(v)
    fetchSuggestions(v)
  }

  function handleSelect(s: AddressSuggestion) {
    setAddress(s.label)
    setSuggestions([])
    setIsOpen(false)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
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
        if (activeIndex >= 0) {
          e.preventDefault()
          handleSelect(suggestions[activeIndex])
        }
        break
      case 'Escape':
        setIsOpen(false)
        setActiveIndex(-1)
        break
    }
  }

  // Close dropdown on outside click.
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setIsOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (address.trim()) onExplore(address.trim())
  }

  return (
    <section className="relative min-h-screen bg-[#1C2C1A] overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 pt-32 pb-20 grid lg:grid-cols-2 gap-12 items-center">
        {/* Left — copy + address */}
        <div>
          <p className="text-[#A3E635] text-xs font-bold uppercase tracking-[0.2em] mb-6">
            Curated Intelligent Valuation
          </p>
          <h1 className="font-heading text-5xl lg:text-6xl font-bold text-white leading-[1.05] mb-6">
            What is your<br />
            <span className="text-[#A3E635]">property worth?</span>
          </h1>
          <p className="text-white/65 text-base leading-relaxed max-w-md mb-10">
            Move beyond automated estimates. Access editorial-grade market intelligence,
            tailored to your home and your goals.
          </p>

          <form onSubmit={submit} className="flex flex-col sm:flex-row gap-3 max-w-xl">
            <div ref={containerRef} className="relative flex-1">
              <div className="flex items-center gap-2 bg-white/10 border border-white/15 rounded-xl px-4 py-3.5 focus-within:border-[#A3E635]/60 transition-colors">
                <MapPin size={18} className="text-white/40 shrink-0" />
                <input
                  value={address}
                  onChange={handleChange}
                  onKeyDown={handleKeyDown}
                  onFocus={() => address && fetchSuggestions(address)}
                  placeholder="Enter your address (e.g., 759 Winona Ave)"
                  className="flex-1 bg-transparent text-sm text-white placeholder-white/40 focus:outline-none"
                  autoComplete="off"
                  aria-autocomplete="list"
                  aria-expanded={isOpen}
                  aria-controls="sell-address-suggestions"
                  role="combobox"
                />
              </div>

              {/* Address autocomplete dropdown */}
              {isOpen && suggestions.length > 0 && (
                <ul
                  id="sell-address-suggestions"
                  role="listbox"
                  className="absolute top-full mt-1.5 w-full bg-white rounded-xl border border-[#E8E6E1] shadow-xl z-50 overflow-hidden text-left"
                >
                  {suggestions.map((s, i) => (
                    <li
                      key={s.id}
                      role="option"
                      aria-selected={i === activeIndex}
                      onMouseDown={() => handleSelect(s)}
                      onMouseEnter={() => setActiveIndex(i)}
                      className={[
                        'flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors',
                        i === activeIndex ? 'bg-[#FAF9F6]' : 'hover:bg-[#FAF9F6]',
                      ].join(' ')}
                    >
                      <Home size={14} className="text-[#6B6B6B] shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#111111] truncate">{s.label}</p>
                        {s.subtitle && (
                          <p className="text-xs text-[#6B6B6B] truncate">{s.subtitle}</p>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <button
              type="submit"
              className="flex items-center justify-center gap-2 px-7 py-3.5 bg-[#A3E635] text-[#111111] text-sm font-bold rounded-xl hover:bg-[#95D62F] transition-colors shrink-0 disabled:opacity-50"
              disabled={!address.trim()}
            >
              Explore Value
              <ArrowRight size={16} />
            </button>
          </form>
        </div>

        {/* Right — hero image + market pulse card */}
        <div className="relative hidden lg:block">
          <div
            className="rounded-2xl h-[460px] bg-cover bg-center shadow-2xl"
            style={{
              backgroundImage:
                'url(https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1000&q=80)',
            }}
          />
          <div className="absolute top-10 -left-6 bg-white rounded-2xl shadow-xl px-6 py-5 w-56">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 rounded-full bg-[#A3E635]" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#6B6B6B]">
                Live Market Pulse
              </span>
            </div>
            <p className="font-heading text-3xl font-bold text-[#111111]">$2.94M</p>
            <p className="text-[#6B6B6B] text-xs mt-1">Median Price · North Van</p>
          </div>
        </div>
      </div>
    </section>
  )
}
