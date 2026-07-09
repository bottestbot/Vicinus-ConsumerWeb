'use client'

import Link from 'next/link'
import { SignUp } from '@clerk/nextjs'
import Logo from '@/components/brand/Logo'

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex font-ui">

      {/* ── Left — forest photo panel ────────────────────────────────────── */}
      <div
        className="hidden lg:flex lg:w-[52%] shrink-0 relative flex-col justify-between p-10"
        style={{
          backgroundImage:
            'url(https://images.unsplash.com/photo-1448375240586-882707db888b?w=1400&q=80)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-black/45" />

        {/* Logo */}
        <div className="relative z-10">
          <Logo href="/" variant="light" className="text-3xl" />
        </div>

        {/* Bottom tagline */}
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-8 h-px bg-white/40" />
          <span className="text-white/70 text-[10px] font-semibold uppercase tracking-[0.25em]">
            The Intelligent Curator
          </span>
        </div>
      </div>

      {/* ── Right — Clerk widget ─────────────────────────────────────────── */}
      <div className="flex-1 bg-[#F5F3EE] flex flex-col items-center justify-center px-8 py-12 overflow-y-auto">

        {/* Mobile logo */}
        <div className="lg:hidden mb-8">
          <Logo href="/" className="text-2xl" />
        </div>

        <SignUp
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
