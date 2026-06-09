'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { UserButton, useUser } from '@clerk/nextjs'
import { Menu, X } from 'lucide-react'

export default function HomeNavbar() {
  const { isSignedIn } = useUser()
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const navLink = scrolled ? 'text-[#6B6B6B] hover:text-[#111111]' : 'text-white/80 hover:text-white'

  return (
    <header
      className={[
        'fixed top-0 w-full z-50 transition-all duration-300',
        scrolled
          ? 'bg-white/95 backdrop-blur-sm border-b border-[#E8E6E1]'
          : 'bg-transparent border-b border-white/10',
      ].join(' ')}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">

        {/* Logo */}
        <Link
          href="/"
          className={[
            'font-heading text-xl transition-colors',
            scrolled ? 'text-[#1C3829]' : 'text-white',
          ].join(' ')}
        >
          Vicinus
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-8 text-sm">
          <Link href="/search?listingType=For+Sale" className={`${navLink} transition-colors`}>
            Buy
          </Link>
          <Link href="/neighbourhoods" className={`${navLink} transition-colors`}>
            Neighbourhoods
          </Link>
          <Link href="/search" className={`${navLink} transition-colors`}>
            Agent Finder
          </Link>
        </nav>

        {/* Desktop auth */}
        <div className="hidden md:flex items-center gap-3">
          {isSignedIn ? (
            <>
              <Link
                href="/dashboard"
                className={`text-sm transition-colors ${navLink}`}
              >
                Dashboard
              </Link>
              <UserButton />
            </>
          ) : (
            <>
              <Link
                href="/sign-in"
                className={`text-sm transition-colors ${navLink}`}
              >
                Sign In
              </Link>
              <Link
                href="/sign-up"
                className={[
                  'text-sm font-semibold px-4 py-2 rounded-lg transition-colors',
                  scrolled
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
          className={`md:hidden p-2 transition-colors ${scrolled ? 'text-[#111111]' : 'text-white'}`}
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-[#E8E6E1] px-6 py-4 flex flex-col gap-0">
          {[
            { label: 'Buy', href: '/search?listingType=For+Sale' },
            { label: 'Neighbourhoods', href: '/neighbourhoods' },
            { label: 'Agent Finder', href: '/search' },
          ].map((item) => (
            <Link
              key={item.label}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className="text-sm text-[#6B6B6B] hover:text-[#111111] py-3 border-b border-[#F2F0EB] transition-colors"
            >
              {item.label}
            </Link>
          ))}
          {isSignedIn ? (
            <Link href="/dashboard" onClick={() => setMobileOpen(false)} className="text-sm text-[#6B6B6B] py-3 border-b border-[#F2F0EB]">
              Dashboard
            </Link>
          ) : (
            <>
              <Link href="/sign-in" onClick={() => setMobileOpen(false)} className="text-sm text-[#6B6B6B] hover:text-[#111111] py-3 border-b border-[#F2F0EB] transition-colors">
                Sign In
              </Link>
              <Link href="/sign-up" onClick={() => setMobileOpen(false)} className="mt-3 text-sm bg-[#1C3829] text-white px-4 py-3 rounded-lg text-center font-medium">
                Get Started
              </Link>
            </>
          )}
        </div>
      )}
    </header>
  )
}
