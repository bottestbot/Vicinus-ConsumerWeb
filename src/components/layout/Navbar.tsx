'use client'
import Link from 'next/link'
import { SignInButton, UserButton, useUser } from '@clerk/nextjs'

export default function Navbar() {
  const { isSignedIn } = useUser()

  return (
    <header className="fixed top-0 w-full z-50 bg-white/90 backdrop-blur-sm border-b border-[var(--border-light)]">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="text-[var(--accent)] font-semibold tracking-widest text-sm uppercase">
          Vicinus
        </Link>
        <nav className="hidden md:flex items-center gap-8 text-[var(--body)] text-sm">
          <Link href="/search" className="hover:text-[var(--heading)] transition-colors">Properties</Link>
          <Link href="/neighbourhoods" className="hover:text-[var(--heading)] transition-colors">Neighbourhoods</Link>
        </nav>
        <div className="flex items-center gap-4">
          {isSignedIn ? (
            <>
              <Link href="/dashboard" className="text-sm text-[var(--body)] hover:text-[var(--heading)] transition-colors">Dashboard</Link>
              <UserButton />
            </>
          ) : (
            <SignInButton>
              <button className="text-sm text-[var(--body)] hover:text-[var(--heading)] transition-colors">Sign In</button>
            </SignInButton>
          )}
        </div>
      </div>
    </header>
  )
}
