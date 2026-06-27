'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Menu, X } from 'lucide-react'
import { useUser } from '@clerk/nextjs'

const NAV_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'Search', href: '/search' },
  { label: 'Feed', href: '/feed' },
  { label: 'Neighbourhoods', href: '/neighbourhoods' },
]

export default function DashboardNavbar() {
  const pathname = usePathname()
  const { user, isLoaded } = useUser()
  const [menuOpen, setMenuOpen] = useState(false)

  const isSignedIn = isLoaded && !!user

  const initials = user?.firstName && user?.lastName
    ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
    : user?.firstName
    ? user.firstName[0].toUpperCase()
    : 'A'

  const isActive = (href: string) =>
    href.startsWith('/dashboard')
      ? pathname === '/dashboard'
      : href === '/'
      ? pathname === '/'
      : pathname.startsWith(href)

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-[#E8E6E1]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">

        {/* Mobile menu toggle */}
        <button
          onClick={() => setMenuOpen((o) => !o)}
          className="md:hidden flex items-center justify-center min-w-[44px] min-h-[44px] -ml-2 text-[#111111] shrink-0 cursor-pointer touch-manipulation"
          style={{ WebkitTapHighlightColor: 'transparent' }}
          aria-label="Toggle navigation menu"
          aria-expanded={menuOpen}
          type="button"
        >
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        {/* Logo */}
        <Link href="/" className="font-heading text-xl text-[#1C3829] shrink-0">
          Vicinus
        </Link>

        {/* Center nav (desktop) */}
        <nav className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm transition-colors pb-0.5 ${
                isActive(link.href)
                  ? 'text-[#111111] font-semibold border-b-2 border-[#111111]'
                  : 'text-[#6B6B6B] hover:text-[#111111]'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right: dashboard + avatar (signed in) OR sign-in buttons (signed out) */}
        <div className="flex items-center gap-3 sm:gap-4">
          {isSignedIn ? (
            <>
              <Link
                href="/dashboard"
                className={`flex items-center gap-1.5 p-2 text-sm transition-colors ${
                  pathname === '/dashboard'
                    ? 'text-[#111111] font-semibold'
                    : 'text-[#6B6B6B] hover:text-[#111111]'
                }`}
              >
                <LayoutDashboard size={18} />
                <span className="hidden sm:block">Dashboard</span>
              </Link>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#1C3829] flex items-center justify-center text-white text-xs font-semibold shrink-0">
                  {initials}
                </div>
              </div>
            </>
          ) : isLoaded ? (
            <>
              <Link
                href="/sign-in"
                className="text-sm text-[#6B6B6B] hover:text-[#111111] transition-colors px-2 py-2"
              >
                Sign In
              </Link>
              <Link
                href="/sign-up"
                className="text-sm bg-[#1C3829] text-white px-4 py-2 rounded-lg hover:bg-[#2D5A3D] transition-colors font-medium"
              >
                Get Started
              </Link>
            </>
          ) : null}
        </div>
      </div>

      {/* Mobile nav dropdown */}
      {menuOpen && (
        <nav className="md:hidden border-t border-[#E8E6E1] bg-white px-4 py-2">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className={`block px-2 py-3 text-sm border-b border-[#F2F0EB] transition-colors ${
                isActive(link.href)
                  ? 'text-[#111111] font-semibold'
                  : 'text-[#6B6B6B] hover:text-[#111111]'
              }`}
            >
              {link.label}
            </Link>
          ))}
          {isSignedIn ? (
            <Link
              href="/dashboard"
              onClick={() => setMenuOpen(false)}
              className={`block px-2 py-3 text-sm border-b border-[#F2F0EB] last:border-0 transition-colors ${
                isActive('/dashboard')
                  ? 'text-[#111111] font-semibold'
                  : 'text-[#6B6B6B] hover:text-[#111111]'
              }`}
            >
              Dashboard
            </Link>
          ) : isLoaded ? (
            <>
              <Link
                href="/sign-in"
                onClick={() => setMenuOpen(false)}
                className="block px-2 py-3 text-sm border-b border-[#F2F0EB] text-[#6B6B6B] hover:text-[#111111] transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/sign-up"
                onClick={() => setMenuOpen(false)}
                className="block mt-3 mb-1 text-sm bg-[#1C3829] text-white px-4 py-3 rounded-lg hover:bg-[#2D5A3D] transition-colors font-medium text-center"
              >
                Get Started
              </Link>
            </>
          ) : null}
        </nav>
      )}
    </header>
  )
}
