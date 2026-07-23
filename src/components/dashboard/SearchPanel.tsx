'use client'

// DASH-01/06: the dashboard "FIND YOUR HOME" search block — a white card holding
// the search bar, a Smart/Classic toggle, helper copy and recent searches,
// matching the placement in the redesign comp.
//
// The Smart mode itself is a separate initiative (SMART-09/11) and isn't built
// yet, so the toggle defaults to Classic and Smart shows an honest "coming soon"
// note rather than a fake natural-language field — no dead/deceptive control.
import { useState } from 'react'
import HeroSearchBar from '@/components/landing/HeroSearchBar'
import RecentSearches from './RecentSearches'

type Mode = 'smart' | 'classic'

function ModeToggle({ mode, onChange }: { mode: Mode; onChange: (m: Mode) => void }) {
  return (
    <div className="inline-flex items-center rounded-full border border-[#E8E6E1] bg-[#F2F0EB] p-0.5 text-xs font-semibold">
      <button
        type="button"
        onClick={() => onChange('smart')}
        aria-pressed={mode === 'smart'}
        className={`flex items-center gap-1 rounded-full px-3 py-1.5 transition-colors ${
          mode === 'smart' ? 'bg-white text-[#1C3829] shadow-sm' : 'text-[#6B6B6B]'
        }`}
      >
        Smart
        <span className="rounded bg-[#A3E635]/30 px-1 text-[9px] font-bold uppercase tracking-wide text-[#1C3829]">
          Beta
        </span>
      </button>
      <button
        type="button"
        onClick={() => onChange('classic')}
        aria-pressed={mode === 'classic'}
        className={`rounded-full px-3 py-1.5 transition-colors ${
          mode === 'classic' ? 'bg-[#1C3829] text-white shadow-sm' : 'text-[#6B6B6B]'
        }`}
      >
        Classic
      </button>
    </div>
  )
}

export default function SearchPanel() {
  const [mode, setMode] = useState<Mode>('classic')

  return (
    <section className="rounded-2xl border border-[#E8E6E1] bg-white p-6">
      <HeroSearchBar
        tone="on-light"
        fullWidth
        rightSlot={<ModeToggle mode={mode} onChange={setMode} />}
      />

      <p className="mt-3 text-xs text-[#6B6B6B]">
        {mode === 'classic'
          ? 'The filters you know — location and price. Prefer plain language? Switch to Smart.'
          : 'Smart search — describe your home in plain language. Coming soon; use Classic for now.'}
      </p>

      <RecentSearches />
    </section>
  )
}
