'use client'

import { useState } from 'react'
import { ArrowRight, Check } from 'lucide-react'
import { submitRealtorWaitlist } from '@/lib/api/waitlist'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

type Status = 'idle' | 'submitting' | 'success' | 'error'

export default function WaitlistForm() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [brokerage, setBrokerage] = useState('')
  const [cityMarket, setCityMarket] = useState('')
  const [company, setCompany] = useState('') // honeypot — must stay empty
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!fullName.trim()) return setError('Please enter your full name.')
    if (!EMAIL_RE.test(email)) return setError('Please enter a valid email address.')

    setStatus('submitting')
    try {
      await submitRealtorWaitlist({
        fullName: fullName.trim(),
        email: email.trim(),
        brokerage: brokerage.trim() || undefined,
        cityMarket: cityMarket.trim() || undefined,
        company: company || undefined,
      })
      // RH-FE-09: fire once the analytics client (DATA-08) lands — guarded no-op
      // until then so this never throws pre-pipeline.
      try {
        ;(
          window as unknown as { posthog?: { capture: (e: string, p?: unknown) => void } }
        ).posthog?.capture('realtor_waitlist_submitted', { cityMarket: cityMarket.trim() })
      } catch {
        /* analytics not yet wired */
      }
      setStatus('success')
    } catch {
      setStatus('error')
      setError('Something went wrong. Please try again.')
    }
  }

  if (status === 'success') {
    return (
      <div className="rounded-2xl border border-[#E8E6E1] bg-white p-8 text-center shadow-sm sm:p-10">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#1C3829]">
          <Check size={22} className="text-[#A3E635]" />
        </div>
        <h3 className="mt-4 font-heading text-2xl font-bold text-[#111111]">You&apos;re on the list.</h3>
        <p className="mt-2 text-sm text-[#6B6B6B]">
          Thanks for joining. We&apos;ll be in touch as founding-member spots open up.
        </p>
      </div>
    )
  }

  const inputCls =
    'w-full rounded-lg border border-[#E8E6E1] bg-[#FAF9F6] px-4 py-3 text-sm text-[#111111] placeholder-[#9A9A9A] outline-none transition-colors focus:border-[#1C3829] focus:bg-white'
  const labelCls = 'mb-1.5 block text-[11px] font-semibold uppercase tracking-widest text-[#6B6B6B]'

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="rounded-2xl border border-[#E8E6E1] bg-white p-6 shadow-sm sm:p-8"
    >
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="wl-name" className={labelCls}>
            Full Name
          </label>
          <input
            id="wl-name"
            type="text"
            autoComplete="name"
            placeholder="John Doe"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className={inputCls}
            required
          />
        </div>
        <div>
          <label htmlFor="wl-email" className={labelCls}>
            Professional Email
          </label>
          <input
            id="wl-email"
            type="email"
            autoComplete="email"
            placeholder="john@brokerage.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputCls}
            required
          />
        </div>
        <div>
          <label htmlFor="wl-brokerage" className={labelCls}>
            Brokerage
          </label>
          <input
            id="wl-brokerage"
            type="text"
            autoComplete="organization"
            placeholder="Luxury Real Estate Co."
            value={brokerage}
            onChange={(e) => setBrokerage(e.target.value)}
            className={inputCls}
          />
        </div>
        <div>
          <label htmlFor="wl-city" className={labelCls}>
            City / Market
          </label>
          <input
            id="wl-city"
            type="text"
            placeholder="Vancouver, Burnaby, Surrey…"
            value={cityMarket}
            onChange={(e) => setCityMarket(e.target.value)}
            className={inputCls}
          />
        </div>
      </div>

      {/* Honeypot — hidden from humans, tempting to bots. Never render visibly. */}
      <div aria-hidden="true" className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="wl-company">Company</label>
        <input
          id="wl-company"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
        />
      </div>

      {error && <p className="mt-4 text-sm text-[#C0392B]">{error}</p>}

      <button
        type="submit"
        disabled={status === 'submitting'}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-[#111111] px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-[#1C3829] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status === 'submitting' ? 'Joining…' : 'Join the Waitlist'}
        {status !== 'submitting' && <ArrowRight size={16} />}
      </button>
    </form>
  )
}
