'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { UserButton, useUser } from '@clerk/nextjs'
import { Menu, X } from 'lucide-react'
import Logo from '@/components/brand/Logo'

/**
 * Single, consistent navbar used across every screen (BUG-04).
 *
 * Centre links:
 *   • Signed out: Home · Buy · Sell · Realtor Hub · Neighbourhoods  → Sign In / Get Started
 *   • Signed in:  Home · Buy · Sell · Neighbourhoods                → Dashboard + avatar
 *
 * `overHero` renders the transparent-over-hero variant (landing / sell / realtor-hub)
 * that turns solid on scroll. Otherwise the navbar is solid + sticky.
 */

interface NavLink {
  label: string
  href: string
  /** Pathname prefix used for the active-state check (href may carry a query). */
  match: string
  /** Hide this link once the user is signed in. */
  hideWhenSignedIn?: boolean
}

const CENTER_LINKS: NavLink[] = [
  { label: 'Home', href: '/', match: '/' },
  { label: 'Buy', href: '/search?listingType=For+Sale', match: '/search' },
  { label: 'Sell', href: '/sell', match: '/sell' },
  { label: 'Realtor Hub', href: '/realtor-hub', match: '/realtor-hub', hideWhenSignedIn: true },
  { label: 'Neighbourhoods', href: '/neighbourhoods', match: '/neighbourhoods' },
]

export default function Navbar({ overHero = false }: { overHero?: boolean }) {
  const pathname = usePathname()
  const { isSignedIn } = useUser()
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    if (!overHero) return
    const onScroll = () => setScrolled(window.scrollY > 60)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [overHero])

  // Solid appearance when not over a hero, or once the hero has been scrolled past.
  const solid = !overHero || scrolled

  const links = CENTER_LINKS.filter((l) => !(l.hideWhenSignedIn && isSignedIn))

  const isActive = (l: NavLink) =>
    l.match === '/' ? pathname === '/' : pathname.startsWith(l.match)

  const linkClass = (active: boolean) => {
    if (solid) {
      return active
        ? 'text-[#111111] font-semibold'
        : 'text-[#6B6B6B] hover:text-[#111111]'
    }
    return active ? 'text-white font-semibold' : 'text-white/80 hover:text-white'
  }

  return (
    <header
      className={[
        'w-full z-50 transition-all duration-300',
        overHero ? 'fixed top-0' : 'sticky top-0',
        solid
          ? 'bg-white/95 backdrop-blur-sm border-b border-[#E8E6E1]'
          : 'bg-transparent border-b border-white/10',
      ].join(' ')}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <Logo href="/" variant={solid ? 'dark' : 'light'} className="text-xl" />

        {/* Desktop centre nav */}
        <nav className="hidden md:flex items-center gap-8 text-sm">
          {links.map((l) => (
            <Link key={l.label} href={l.href} className={`${linkClass(isActive(l))} transition-colors`}>
              {l.label}
            </Link>
          ))}
        </nav>

        {/* Desktop right: auth */}
        <div className="hidden md:flex items-center gap-3 shrink-0">
          {isSignedIn ? (
            <>
              <Link
                href="/dashboard"
                className={`text-sm transition-colors ${linkClass(pathname === '/dashboard')}`}
              >
                Dashboard
              </Link>
              <UserButton />
            </>
          ) : (
            <>
              <Link href="/sign-in" className={`text-sm transition-colors ${linkClass(false)}`}>
                Sign In
              </Link>
              <Link
                href="/sign-up"
                className={[
                  'text-sm font-semibold px-4 py-2 rounded-lg transition-colors',
                  solid
                    ? 'bg-[#1C3829] text-white hover:bg-[#2D5A3D]'
                    : 'bg-white text-[#1C3829] hover:bg-white/90',
                ].join(' ')}
              >
                Get Started
              </Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className={[
            'md:hidden flex items-center justify-center min-w-[44px] min-h-[44px] transition-colors cursor-pointer touch-manipulation',
            solid ? 'text-[#111111]' : 'text-white',
          ].join(' ')}
          style={{ WebkitTapHighlightColor: 'transparent' }}
          onClick={() => setMobileOpen((o) => !o)}
          aria-label="Toggle menu"
          aria-expanded={mobileOpen}
          type="button"
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-[#E8E6E1] px-6 py-4 flex flex-col gap-0">
          {links.map((l) => (
            <Link
              key={l.label}
              href={l.href}
              onClick={() => setMobileOpen(false)}
              className={[
                'text-sm py-3 border-b border-[#F2F0EB] transition-colors',
                isActive(l) ? 'text-[#111111] font-semibold' : 'text-[#6B6B6B] hover:text-[#111111]',
              ].join(' ')}
            >
              {l.label}
            </Link>
          ))}
          {isSignedIn ? (
            <div className="flex items-center justify-between py-3">
              <Link
                href="/dashboard"
                onClick={() => setMobileOpen(false)}
                className="text-sm text-[#6B6B6B] hover:text-[#111111] transition-colors"
              >
                Dashboard
              </Link>
              <UserButton />
            </div>
          ) : (
            <>
              <Link
                href="/sign-in"
                onClick={() => setMobileOpen(false)}
                className="text-sm text-[#6B6B6B] hover:text-[#111111] py-3 border-b border-[#F2F0EB] transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/sign-up"
                onClick={() => setMobileOpen(false)}
                className="mt-3 text-sm bg-[#1C3829] text-white px-4 py-3 rounded-lg text-center font-medium"
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      )}
    </header>
  )
}
