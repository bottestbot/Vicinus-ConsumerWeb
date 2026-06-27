'use client'

import { useState } from 'react'
import Link from 'next/link'
import { UserButton, useUser } from '@clerk/nextjs'
import { Menu } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'

export default function Navbar() {
  const { isSignedIn } = useUser()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <header className="fixed top-0 w-full z-50 bg-white/90 backdrop-blur-sm border-b border-[var(--border-light)]">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">

        {/* Logo */}
        <Link href="/" className="font-heading text-xl text-[#1C3829]">
          Vicinus
        </Link>

        {/* Desktop nav links */}
        <nav className="hidden md:flex items-center gap-8 text-[var(--body)] text-sm">
          <Link href="/search" className="hover:text-[var(--heading)] transition-colors">
            Properties
          </Link>
          <Link href="/feed" className="hover:text-[var(--heading)] transition-colors">
            Feed
          </Link>
          <Link href="/neighbourhoods" className="hover:text-[var(--heading)] transition-colors">
            Neighbourhoods
          </Link>
        </nav>

        {/* Desktop auth */}
        <div className="hidden md:flex items-center gap-3">
          {isSignedIn ? (
            <>
              <Link
                href="/dashboard"
                className="text-sm text-[var(--body)] hover:text-[var(--heading)] transition-colors"
              >
                Dashboard
              </Link>
              <UserButton />
            </>
          ) : (
            <>
              <Link
                href="/sign-in"
                className="text-sm text-[var(--body)] hover:text-[var(--heading)] transition-colors px-3 py-2"
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
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden flex items-center justify-center min-w-[44px] min-h-[44px] text-[var(--body)] hover:text-[var(--heading)] transition-colors cursor-pointer touch-manipulation"
          style={{ WebkitTapHighlightColor: 'transparent' }}
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
          type="button"
        >
          <Menu size={22} />
        </button>
      </div>

      {/* Mobile drawer */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="right" className="bg-white w-72 px-0">
          <SheetHeader className="px-6 pb-4 border-b border-[#E8E6E1]">
            <SheetTitle className="font-heading text-xl text-[#1C3829]">Vicinus</SheetTitle>
          </SheetHeader>

          <nav className="flex flex-col px-6 pt-4 gap-0">
            <Link
              href="/search"
              onClick={() => setMobileOpen(false)}
              className="text-sm text-[#6B6B6B] hover:text-[#111111] py-3.5 border-b border-[#E8E6E1] transition-colors"
            >
              Properties
            </Link>
            <Link
              href="/feed"
              onClick={() => setMobileOpen(false)}
              className="text-sm text-[#6B6B6B] hover:text-[#111111] py-3.5 border-b border-[#E8E6E1] transition-colors"
            >
              Feed
            </Link>
            <Link
              href="/neighbourhoods"
              onClick={() => setMobileOpen(false)}
              className="text-sm text-[#6B6B6B] hover:text-[#111111] py-3.5 border-b border-[#E8E6E1] transition-colors"
            >
              Neighbourhoods
            </Link>

            {isSignedIn ? (
              <Link
                href="/dashboard"
                onClick={() => setMobileOpen(false)}
                className="text-sm text-[#6B6B6B] hover:text-[#111111] py-3.5 border-b border-[#E8E6E1] transition-colors"
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/sign-in"
                  onClick={() => setMobileOpen(false)}
                  className="text-sm text-[#6B6B6B] hover:text-[#111111] py-3.5 border-b border-[#E8E6E1] transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/sign-up"
                  onClick={() => setMobileOpen(false)}
                  className="mt-4 text-sm bg-[#1C3829] text-white px-4 py-3 rounded-lg hover:bg-[#2D5A3D] transition-colors font-medium text-center"
                >
                  Get Started
                </Link>
              </>
            )}
          </nav>
        </SheetContent>
      </Sheet>
    </header>
  )
}
