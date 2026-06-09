'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useSignIn, AuthenticateWithRedirectCallback } from '@clerk/nextjs'
import { Eye, EyeOff } from 'lucide-react'

// ── Icon helpers ──────────────────────────────────────────────────────────────

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

function GoogleIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  )
}

function AppleIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701" />
    </svg>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function SignInPage() {
  const pathname = usePathname()
  if (pathname?.includes('sso-callback')) {
    return <AuthenticateWithRedirectCallback />
  }
  return <SignInForm />
}

function SignInForm() {
  const { signIn, setActive, isLoaded } = useSignIn()
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [keepSignedIn, setKeepSignedIn] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isLoaded) return
    setLoading(true)
    setError('')
    try {
      const result = await signIn.create({ identifier: email, password })
      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId })
        router.push('/dashboard')
      }
    } catch (err: unknown) {
      const ce = err as { errors?: { message: string }[] }
      setError(ce.errors?.[0]?.message ?? 'Sign in failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleOAuth(provider: 'oauth_google' | 'oauth_apple') {
    if (!isLoaded) return
    await signIn.authenticateWithRedirect({
      strategy: provider,
      redirectUrl: '/sign-in/sso-callback',
      redirectUrlComplete: '/dashboard',
    })
  }

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
        {/* Overlay */}
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

      {/* ── Right — form panel ───────────────────────────────────────────── */}
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

        <div className="w-full max-w-[360px]">
          <h1 className="font-heading text-2xl font-semibold text-[#111111] mb-1.5">
            Sign In
          </h1>
          <p className="text-sm text-[#6B6B6B] mb-8 leading-relaxed">
            Welcome back. Please enter your credentials to access your curated
            portfolio.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-widest text-[#6B6B6B] mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@firm.com"
                required
                className="w-full px-4 py-3 bg-[#ECEAE4] border-0 rounded-lg text-sm text-[#111111] placeholder-[#9B9B9B] focus:outline-none focus:ring-2 focus:ring-[#1C3829]/25"
              />
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[10px] font-semibold uppercase tracking-widest text-[#6B6B6B]">
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-[#1C3829] hover:underline"
                >
                  Forgot Password?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-4 py-3 pr-11 bg-[#ECEAE4] border-0 rounded-lg text-sm text-[#111111] placeholder-[#9B9B9B] focus:outline-none focus:ring-2 focus:ring-[#1C3829]/25"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9B9B9B] hover:text-[#6B6B6B] transition-colors"
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Keep signed in */}
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={keepSignedIn}
                onChange={(e) => setKeepSignedIn(e.target.checked)}
                className="w-4 h-4 rounded border-[#D1CEC9] text-[#1C3829] accent-[#1C3829]"
              />
              <span className="text-sm text-[#6B6B6B]">Keep me signed in for 30 days</span>
            </label>

            {/* Error */}
            {error && (
              <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !isLoaded}
              className="w-full py-3.5 bg-[#1C3829] text-white font-semibold text-sm rounded-xl hover:bg-[#2D5A3D] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-[#DDD9D2]" />
            <span className="text-[10px] text-[#9B9B9B] uppercase tracking-widest whitespace-nowrap">
              Or continue with
            </span>
            <div className="flex-1 h-px bg-[#DDD9D2]" />
          </div>

          {/* OAuth */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleOAuth('oauth_google')}
              className="flex items-center justify-center gap-2 py-3 bg-white border border-[#DDD9D2] rounded-xl text-sm text-[#111111] hover:bg-[#F0EDE7] transition-colors"
            >
              <GoogleIcon />
              Google
            </button>
            <button
              onClick={() => handleOAuth('oauth_apple')}
              className="flex items-center justify-center gap-2 py-3 bg-white border border-[#DDD9D2] rounded-xl text-sm text-[#111111] hover:bg-[#F0EDE7] transition-colors"
            >
              <AppleIcon />
              Apple
            </button>
          </div>

          <p className="text-center text-sm text-[#6B6B6B] mt-7">
            New to Vicinus?{' '}
            <Link
              href="/sign-up"
              className="text-[#1C3829] font-semibold hover:underline"
            >
              Create an account
            </Link>
          </p>

          <Link
            href="/"
            className="block text-center mt-5 text-xs text-[#9B9B9B] hover:text-[#6B6B6B] transition-colors"
          >
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  )
}
