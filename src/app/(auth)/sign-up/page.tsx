import type { Metadata } from 'next'
import Link from 'next/link'
import { SignUp } from '@clerk/nextjs'

export const metadata: Metadata = {
  title: 'Create Account',
  description: 'Join Vicinus — your intelligent curator of luxury Canadian real estate.',
}

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-[#FAF9F6] flex">

      {/* Left — brand panel (desktop only) */}
      <div className="hidden lg:flex lg:w-[46%] bg-[#1C3829] flex-col justify-between p-12 shrink-0">
        <Link href="/" className="font-heading text-2xl text-white">
          Vicinus
        </Link>

        <div>
          <p className="text-white/50 text-[11px] font-semibold uppercase tracking-widest mb-5">
            Join Canada&apos;s Most Discerning Community
          </p>
          <h2 className="font-heading text-4xl font-bold text-white leading-tight mb-10">
            Beyond data. The Vicinus standard.
          </h2>
          <ul className="space-y-4">
            {[
              'Access curated luxury listings first',
              'Save searches and get instant alerts',
              'Deep neighbourhood intelligence',
              'Connect with area specialist agents',
            ].map((benefit) => (
              <li key={benefit} className="flex items-center gap-3 text-white/70 text-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-white/50 shrink-0" />
                {benefit}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-white/25 text-xs">© {new Date().getFullYear()} Vicinus</p>
      </div>

      {/* Right — Clerk form */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        {/* Mobile logo */}
        <Link href="/" className="lg:hidden font-heading text-2xl text-[#1C3829] mb-8">
          Vicinus
        </Link>

        <SignUp fallbackRedirectUrl="/dashboard" />

        <Link
          href="/"
          className="mt-8 text-xs text-[#6B6B6B] hover:text-[#111111] transition-colors"
        >
          ← Back to home
        </Link>
      </div>
    </div>
  )
}
