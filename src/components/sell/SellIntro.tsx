'use client'

import { useState } from 'react'
import { MapPin, ArrowRight } from 'lucide-react'

export default function SellIntro({ onExplore }: { onExplore: (address: string) => void }) {
  const [address, setAddress] = useState('')

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
            <div className="flex items-center gap-2 flex-1 bg-white/10 border border-white/15 rounded-xl px-4 py-3.5 focus-within:border-[#A3E635]/60 transition-colors">
              <MapPin size={18} className="text-white/40 shrink-0" />
              <input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Enter your address (e.g., 759 Winona Ave)"
                className="flex-1 bg-transparent text-sm text-white placeholder-white/40 focus:outline-none"
                autoComplete="off"
              />
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
