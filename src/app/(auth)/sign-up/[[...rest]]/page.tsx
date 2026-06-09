'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useSignUp, AuthenticateWithRedirectCallback } from '@clerk/nextjs'
import { Eye, EyeOff, User, Headphones } from 'lucide-react'

// ── Icon helpers ──────────────────────────────────────────────────────────────

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

// ── Page ──────────────────────────────────────────────────────────────────────

type Role = 'buyer' | 'agent'

export default function SignUpPage() {
  const pathname = usePathname()
  if (pathname?.includes('sso-callback')) {
    return <AuthenticateWithRedirectCallback />
  }
  return <SignUpForm />
}

function SignUpForm() {
  const { signUp, setActive, isLoaded } = useSignUp()
  const router = useRouter()

  const [role, setRole] = useState<Role>('buyer')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [agreed, setAgreed] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [pendingVerification, setPendingVerification] = useState(false)
  const [verificationCode, setVerificationCode] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isLoaded || !agreed || !signUp) return
    setLoading(true)
    setError('')

    const [firstName, ...restName] = fullName.trim().split(' ')
    const lastName = restName.join(' ') || ''

    try {
      const result = await signUp.create({
        firstName,
        lastName,
        emailAddress: email,
        password,
        unsafeMetadata: { role },
      })
      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId })
        router.push('/dashboard')
      } else {
        // Email verification required
        await signUp.prepareEmailAddressVerification({ strategy: 'email_code' })
        setPendingVerification(true)
      }
    } catch (err: unknown) {
      const ce = err as { errors?: { longMessage?: string; message: string }[] }
      setError(ce.errors?.[0]?.longMessage ?? ce.errors?.[0]?.message ?? 'Sign up failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault()
    if (!isLoaded || !signUp) return
    setLoading(true)
    setError('')
    try {
      const result = await signUp.attemptEmailAddressVerification({
        code: verificationCode,
      })
      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId })
        router.push('/dashboard')
      } else {
        setError('Verification incomplete. Please try again.')
      }
    } catch (err: unknown) {
      const ce = err as { errors?: { longMessage?: string; message: string }[] }
      setError(ce.errors?.[0]?.longMessage ?? ce.errors?.[0]?.message ?? 'Invalid code. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleOAuth(provider: 'oauth_google') {
    if (!isLoaded) return
    await signUp.authenticateWithRedirect({
      strategy: provider,
      redirectUrl: '/sign-up/sso-callback',
      redirectUrlComplete: '/dashboard',
    })
  }

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
        {/* Overlay */}
        <div className="absolute inset-0 bg-black/45" />

        {/* Logo — lime green */}
        <div className="relative z-10">
          <span className="font-heading text-3xl font-bold text-[#A3E635] tracking-tight uppercase">
            VICINUS
          </span>
        </div>

        {/* Bottom tagline */}
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-8 h-px bg-white/40" />
          <span className="text-white/70 text-[10px] font-semibold uppercase tracking-[0.25em]">
            The Intelligent Curator
          </span>
        </div>
      </div>

      {/* ── Right — form panel ───────────────────────────────────────────── */}
      <div className="flex-1 bg-[#F5F3EE] flex flex-col items-center justify-center px-8 py-12 overflow-y-auto">

        {/* Mobile logo */}
        <Link href="/" className="lg:hidden font-heading text-2xl font-bold text-[#A3E635] uppercase mb-8">
          VICINUS
        </Link>

        {pendingVerification ? (
          /* ── Email verification step ── */
          <div className="w-full max-w-[360px]">
            <h1 className="font-heading text-2xl font-semibold text-[#111111] mb-1.5">
              Verify your email
            </h1>
            <p className="text-sm text-[#6B6B6B] mb-8 leading-relaxed">
              We sent a 6-digit code to <strong>{email}</strong>. Enter it below to
              activate your account.
            </p>
            <form onSubmit={handleVerify} className="space-y-5">
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-widest text-[#6B6B6B] mb-1.5">
                  Verification Code
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  placeholder="000000"
                  required
                  className="w-full px-4 py-3 bg-[#ECEAE4] border-0 rounded-lg text-sm text-[#111111] placeholder-[#9B9B9B] focus:outline-none focus:ring-2 focus:ring-[#A3E635]/40 tracking-[0.3em] text-center text-lg font-semibold"
                />
              </div>
              {error && (
                <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-[#A3E635] text-[#111111] font-semibold text-sm rounded-xl hover:bg-[#95D62F] transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {loading ? 'Verifying…' : 'Verify & Continue →'}
              </button>
            </form>
          </div>
        ) : (
          /* ── Sign up form ── */
          <div className="w-full max-w-[360px]">
            <h1 className="font-heading text-2xl font-semibold text-[#111111] mb-1.5">
              Create Account
            </h1>
            <p className="text-sm text-[#6B6B6B] mb-7 leading-relaxed">
              Join the elite network of property curators and investors.
            </p>

            {/* Role toggle */}
            <div className="mb-6">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[#6B6B6B] mb-2.5">
                I Am Joining As
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRole('buyer')}
                  className={[
                    'flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all border',
                    role === 'buyer'
                      ? 'bg-[#1C3829] text-white border-[#1C3829]'
                      : 'bg-white text-[#6B6B6B] border-[#DDD9D2] hover:border-[#1C3829]/40',
                  ].join(' ')}
                >
                  <User size={15} />
                  I am a Buyer
                </button>
                <button
                  type="button"
                  onClick={() => setRole('agent')}
                  className={[
                    'flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all border',
                    role === 'agent'
                      ? 'bg-[#1C3829] text-white border-[#1C3829]'
                      : 'bg-white text-[#6B6B6B] border-[#DDD9D2] hover:border-[#1C3829]/40',
                  ].join(' ')}
                >
                  <Headphones size={15} />
                  I am an Agent
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full Name */}
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-widest text-[#6B6B6B] mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Alexander Curator"
                  required
                  className="w-full px-4 py-3 bg-[#ECEAE4] border-0 rounded-lg text-sm text-[#111111] placeholder-[#9B9B9B] focus:outline-none focus:ring-2 focus:ring-[#A3E635]/40"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-widest text-[#6B6B6B] mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alex@curator.io"
                  required
                  className="w-full px-4 py-3 bg-[#ECEAE4] border-0 rounded-lg text-sm text-[#111111] placeholder-[#9B9B9B] focus:outline-none focus:ring-2 focus:ring-[#A3E635]/40"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-widest text-[#6B6B6B] mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    required
                    minLength={8}
                    className="w-full px-4 py-3 pr-11 bg-[#ECEAE4] border-0 rounded-lg text-sm text-[#111111] placeholder-[#9B9B9B] focus:outline-none focus:ring-2 focus:ring-[#A3E635]/40"
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

              {/* Terms */}
              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  required
                  className="w-4 h-4 mt-0.5 rounded border-[#D1CEC9] accent-[#1C3829] shrink-0"
                />
                <span className="text-sm text-[#6B6B6B] leading-snug">
                  I agree to the{' '}
                  <Link href="/terms" className="font-semibold text-[#111111] hover:underline">
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link href="/privacy" className="font-semibold text-[#111111] hover:underline">
                    Privacy Policy
                  </Link>
                  .
                </span>
              </label>

              {/* Error */}
              {error && (
                <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
              )}

              {/* Submit — lime green */}
              <button
                type="submit"
                disabled={loading || !agreed || !isLoaded}
                className="w-full py-3.5 bg-[#A3E635] text-[#111111] font-semibold text-sm rounded-xl hover:bg-[#95D62F] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? 'Creating account…' : 'Create Account →'}
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 h-px bg-[#DDD9D2]" />
              <span className="text-[10px] text-[#9B9B9B] uppercase tracking-widest">Or</span>
              <div className="flex-1 h-px bg-[#DDD9D2]" />
            </div>

            {/* Google OAuth */}
            <button
              onClick={() => handleOAuth('oauth_google')}
              className="w-full flex items-center justify-center gap-2 py-3 bg-white border border-[#DDD9D2] rounded-xl text-sm text-[#111111] hover:bg-[#F0EDE7] transition-colors"
            >
              <GoogleIcon />
              Continue with Google
            </button>

            <p className="text-center text-sm text-[#6B6B6B] mt-6">
              Already have an account?{' '}
              <Link href="/sign-in" className="font-semibold text-[#111111] hover:underline">
                Sign In
              </Link>
            </p>

            <p className="text-center text-[10px] text-[#9B9B9B] mt-6">
              © {new Date().getFullYear()} Vicinus Curation Ltd.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
