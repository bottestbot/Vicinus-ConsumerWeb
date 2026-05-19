'use client'
import Link from 'next/link'
import { SignInButton, UserButton, useUser } from '@clerk/nextjs'

export default function Navbar() {
  const { isSignedIn } = useUser()

  return (
    <header className="fixed top-0 w-full z-50 bg-black/80 backdrop-blur-sm border-b border-white/10">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="text-white font-semibold tracking-widest text-sm uppercase">
          Vicinus
        </Link>
        <nav className="hidden md:flex items-center gap-8 text-white/70 text-sm">
          <Link href="/search" className="hover:text-white transition-colors">Properties</Link>
          <Link href="/neighbourhoods" className="hover:text-white transition-colors">Neighbourhoods</Link>
        </nav>
        <div className="flex items-center gap-4">
          {isSignedIn ? (
            <>
              <Link href="/dashboard" className="text-sm text-white/70 hover:text-white transition-colors">Dashboard</Link>
              <UserButton />
            </>
          ) : (
            <SignInButton>
              <button className="text-sm text-white/70 hover:text-white transition-colors">Sign In</button>
            </SignInButton>
          )}
        </div>
      </div>
    </header>
  )
}
