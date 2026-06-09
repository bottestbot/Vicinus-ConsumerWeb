'use client'

import Link from 'next/link'
import { SignIn } from '@clerk/nextjs'

function GridIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="white" aria-hidden="true">
      <rect x="0" y="0" width="8" height="8" rx="1.5" />
      <rect x="10" y="0" width="8" height="8" rx="1.5" />
      <rect x="0" y="10" width="8" height="8" rx="1.5" />
      <rect x="10" y="10" width="8" height="8" rx="1.5" />
    </svg>
  )
}

export default function SignInPage() {
  return (
    <div className="min-h-screen flex font-ui">

      {/* ── Left — photo panel ───────────────────────────────────────────── */}
      <div
        className="hidden lg:flex lg:w-[52%] shrink-0 relative flex-col justify-between p-10"
        style={{
          backgroundImage:
            'url(https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1400&q=80)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-black/50" />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-2.5">
          <div className="w-8 h-8 bg-white/15 rounded-md flex items-center justify-center">
            <GridIcon />
          </div>
          <span className="text-white font-semibold tracking-[0.2em] text-sm uppercase">
            VICINUS
          </span>
        </div>

        {/* Tagline */}
        <div className="relative z-10 space-y-3 max-w-sm">
          <p className="text-white font-semibold text-xl leading-snug">
            Curating space for the modern visionary.
          </p>
          <p className="text-white/55 text-sm leading-relaxed">
            Enter a world where property data meets architectural intelligence.
            Vicinus provides a sophisticated platform for elite agents and
            discerning buyers.
          </p>
        </div>

        {/* Footer */}
        <div className="relative z-10 flex items-center gap-6 text-white/35 text-[10px] uppercase tracking-widest">
          <span>© {new Date().getFullYear()} Curator Group</span>
          <Link href="/privacy" className="hover:text-white/60 transition-colors">
            Privacy Policy
          </Link>
        </div>
      </div>

      {/* ── Right — Clerk widget ─────────────────────────────────────────── */}
      <div className="flex-1 bg-[#F5F3EE] flex flex-col items-center justify-center px-8 py-12 overflow-y-auto">

        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-2 mb-10">
          <div className="w-7 h-7 bg-[#1C3829] rounded flex items-center justify-center">
            <GridIcon />
          </div>
          <span className="font-semibold tracking-[0.2em] text-sm uppercase text-[#1C3829]">
            VICINUS
          </span>
        </div>

        <SignIn
          fallbackRedirectUrl="/dashboard"
          appearance={{
            variables: {
              colorPrimary: '#1C3829',
              colorBackground: '#F5F3EE',
              colorInputBackground: '#ECEAE4',
              colorText: '#111111',
              colorTextSecondary: '#6B6B6B',
              borderRadius: '0.75rem',
            },
            elements: {
              card: 'shadow-none bg-transparent',
              headerTitle: 'font-heading',
            },
          }}
        />

        <Link
          href="/"
          className="mt-6 text-xs text-[#9B9B9B] hover:text-[#6B6B6B] transition-colors"
        >
          ← Back to home
        </Link>
      </div>
    </div>
  )
}
