'use client'

import { useMemo, useState } from 'react'
import { AxiosError } from 'axios'
import { ArrowRight, Check, ChevronLeft, ChevronRight } from 'lucide-react'
import { submitRealtorWaitlist } from '@/lib/api/waitlist'
import { bookDiscoveryCall } from '@/lib/api/booking'
import { track } from '@/lib/analytics/capture'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * Turn a request failure into something diagnosable from the UI alone.
 *
 * A bare "something went wrong" makes every cause look identical — a missing
 * route, an unmigrated database, a blocked origin, an unreachable host — which
 * is unusable when the only signal is a user's screenshot. Surface the server's
 * own message when it sends one, and always carry the status code.
 */
function failureMessage(err: unknown, fallback: string): string {
  if (!(err instanceof AxiosError)) return fallback

  // No response at all: DNS, TLS, a blocked CORS preflight, or a down host.
  if (!err.response) {
    return 'Could not reach the server. Please check your connection and try again.'
  }

  const { status, data } = err.response
  const raw = (data as { message?: string | string[] } | undefined)?.message
  const detail = Array.isArray(raw) ? raw[0] : raw

  return detail ? `${detail} (error ${status})` : `${fallback} (error ${status})`
}

const NEIGHBOURHOODS = [
  'Kitsilano',
  'Point Grey',
  'Dunbar-Southlands',
  'Mount Pleasant',
  'Kerrisdale',
  'Shaughnessy',
  'West End',
  'Yaletown',
  'North Vancouver',
  'West Vancouver',
  'Burnaby',
  'Richmond',
  'Surrey',
  'New Westminster',
  'Coquitlam',
]

const TIME_SLOTS = ['9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM']

type Status = 'idle' | 'submitting' | 'success' | 'error'

function ReserveForm() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [brokerage, setBrokerage] = useState('')
  const [neighbourhood, setNeighbourhood] = useState('')
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
        cityMarket: neighbourhood || undefined,
        company: company || undefined,
      })
      track('realtor_waitlist_submitted', { cityMarket: neighbourhood })
      setStatus('success')
    } catch (err) {
      setStatus('error')
      setError(failureMessage(err, 'Something went wrong. Please try again.'))
    }
  }

  if (status === 'success') {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-8 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#A3E635]">
          <Check size={22} className="text-[#111111]" />
        </div>
        <h3 className="mt-4 font-heading text-xl font-bold text-white">
          You&apos;re on the list.
        </h3>
        <p className="mt-2 text-sm text-white/60">
          We&apos;ll be in touch as your neighbourhood&apos;s founding spots open up.
        </p>
      </div>
    )
  }

  const inputCls =
    'w-full rounded-lg border border-white/15 bg-white/[0.06] px-4 py-3 text-sm text-white placeholder-white/35 outline-none transition-colors focus:border-[#A3E635]'
  const labelCls = 'mb-1.5 block text-[11px] font-semibold uppercase tracking-widest text-white/50'

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <div>
        <label htmlFor="ca-name" className={labelCls}>
          Full Name
        </label>
        <input
          id="ca-name"
          type="text"
          autoComplete="name"
          placeholder="e.g. Sarah Mitchell"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className={inputCls}
          required
        />
      </div>
      <div>
        <label htmlFor="ca-email" className={labelCls}>
          Email Address
        </label>
        <input
          id="ca-email"
          type="email"
          autoComplete="email"
          placeholder="e.g. sarah@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputCls}
          required
        />
      </div>
      <div>
        <label htmlFor="ca-brokerage" className={labelCls}>
          Brokerage
        </label>
        <input
          id="ca-brokerage"
          type="text"
          autoComplete="organization"
          placeholder="e.g. Royal LePage Sterling"
          value={brokerage}
          onChange={(e) => setBrokerage(e.target.value)}
          className={inputCls}
        />
      </div>
      <div>
        <label htmlFor="ca-neighbourhood" className={labelCls}>
          Primary Neighbourhood
        </label>
        <select
          id="ca-neighbourhood"
          value={neighbourhood}
          onChange={(e) => setNeighbourhood(e.target.value)}
          className={`${inputCls} appearance-none`}
        >
          <option value="" className="text-[#111111]">
            Select a Greater Vancouver area...
          </option>
          {NEIGHBOURHOODS.map((n) => (
            <option key={n} value={n} className="text-[#111111]">
              {n}
            </option>
          ))}
        </select>
      </div>

      {/* Honeypot — hidden from humans, tempting to bots. Never render visibly. */}
      <div aria-hidden="true" className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="ca-company">Company</label>
        <input
          id="ca-company"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
        />
      </div>

      {error && <p className="text-sm text-[#F2A2A2]">{error}</p>}

      <button
        type="submit"
        disabled={status === 'submitting'}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#A3E635] px-6 py-3.5 text-sm font-bold text-[#111111] transition-colors hover:bg-[#95D62F] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status === 'submitting' ? 'Reserving…' : 'Reserve My Spot'}
        {status !== 'submitting' && <ArrowRight size={16} />}
      </button>
    </form>
  )
}

function DiscoveryCallCard() {
  const [monthOffset, setMonthOffset] = useState(0)
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [contactName, setContactName] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState<string | null>(null)

  const { label, weeks, year, month } = useMemo(() => {
    const base = new Date()
    base.setDate(1)
    base.setMonth(base.getMonth() + monthOffset)
    const y = base.getFullYear()
    const m = base.getMonth()
    const firstWeekday = new Date(y, m, 1).getDay()
    const daysInMonth = new Date(y, m + 1, 0).getDate()

    const cells: (number | null)[] = [
      ...Array(firstWeekday).fill(null),
      ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
    ]
    while (cells.length % 7 !== 0) cells.push(null)
    const rows: (number | null)[][] = []
    for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7))

    return {
      label: base.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      weeks: rows,
      year: y,
      month: m,
    }
  }, [monthOffset])

  const today = new Date()
  const isPast = (day: number) => {
    const d = new Date(year, month, day)
    d.setHours(0, 0, 0, 0)
    const t = new Date(today)
    t.setHours(0, 0, 0, 0)
    return d < t
  }

  async function handleConfirm() {
    if (!selectedDay || !selectedTime) return
    if (!contactName.trim()) return setError('Please enter your name.')
    if (!EMAIL_RE.test(contactEmail)) return setError('Please enter a valid email address.')

    setError(null)
    setStatus('submitting')
    try {
      const date = `${year}-${String(month + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`
      await bookDiscoveryCall({
        fullName: contactName.trim(),
        email: contactEmail.trim(),
        date,
        timeSlot: selectedTime,
      })
      setStatus('success')
    } catch (err) {
      setStatus('error')
      if (err instanceof AxiosError && err.response?.status === 409) {
        setError('That time slot was just booked — please pick another.')
        setSelectedTime(null)
      } else {
        setError(failureMessage(err, 'Something went wrong. Please try again.'))
      }
    }
  }

  if (status === 'success' && selectedDay && selectedTime) {
    const formattedDate = new Date(year, month, selectedDay).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
    return (
      <div className="rounded-2xl bg-white p-6 text-center shadow-xl sm:p-8">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#1C3829]">
          <Check size={22} className="text-[#A3E635]" />
        </div>
        <h3 className="mt-4 font-heading text-xl font-bold text-[#111111]">
          Call requested.
        </h3>
        <p className="mt-2 text-sm text-[#6B6B6B]">
          Tom will confirm your {formattedDate} slot at {selectedTime} by email shortly.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl bg-white p-6 shadow-xl sm:p-8">
      <h3 className="font-heading text-lg font-bold text-[#111111]">
        Book a 15-minute discovery call
      </h3>
      <p className="mt-1 text-sm text-[#6B6B6B]">
        Chat with Tom to learn more about the Founding Member benefits.
      </p>

      <div className="mt-6 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setMonthOffset((v) => v - 1)}
          aria-label="Previous month"
          className="rounded-md p-1 text-[#6B6B6B] hover:bg-[#F2F0EB]"
        >
          <ChevronLeft size={16} />
        </button>
        <p className="text-sm font-semibold text-[#111111]">{label}</p>
        <button
          type="button"
          onClick={() => setMonthOffset((v) => v + 1)}
          aria-label="Next month"
          className="rounded-md p-1 text-[#6B6B6B] hover:bg-[#F2F0EB]"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      <div className="mt-4 grid grid-cols-7 gap-1 text-center text-[10px] font-semibold uppercase text-[#9A9A9A]">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          <span key={`${d}-${i}`}>{d}</span>
        ))}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-1">
        {weeks.flat().map((day, i) => {
          if (day === null) return <span key={i} />
          const disabled = isPast(day)
          const selected = selectedDay === day
          return (
            <button
              key={i}
              type="button"
              disabled={disabled}
              onClick={() => setSelectedDay(day)}
              className={[
                'aspect-square rounded-full text-xs font-medium transition-colors',
                selected
                  ? 'bg-[#A3E635] text-[#111111] font-bold'
                  : disabled
                    ? 'text-[#D8D5CC]'
                    : 'text-[#111111] hover:bg-[#F2F0EB]',
              ].join(' ')}
            >
              {day}
            </button>
          )
        })}
      </div>

      <div className="mt-6">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-[#6B6B6B]">
          Available Times
        </p>
        <div className="grid grid-cols-2 gap-2">
          {TIME_SLOTS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setSelectedTime(t)}
              className={[
                'rounded-lg border px-3 py-2 text-xs font-semibold transition-colors',
                selectedTime === t
                  ? 'border-[#1C3829] bg-[#1C3829] text-white'
                  : 'border-[#E8E6E1] text-[#111111] hover:border-[#1C3829]',
              ].join(' ')}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {selectedDay && selectedTime && (
        <div className="mt-6 space-y-3 border-t border-[#E8E6E1] pt-6">
          <input
            type="text"
            autoComplete="name"
            placeholder="Your name"
            value={contactName}
            onChange={(e) => setContactName(e.target.value)}
            className="w-full rounded-lg border border-[#E8E6E1] bg-[#FAF9F6] px-4 py-2.5 text-sm text-[#111111] placeholder-[#9A9A9A] outline-none transition-colors focus:border-[#1C3829] focus:bg-white"
          />
          <input
            type="email"
            autoComplete="email"
            placeholder="Your email"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            className="w-full rounded-lg border border-[#E8E6E1] bg-[#FAF9F6] px-4 py-2.5 text-sm text-[#111111] placeholder-[#9A9A9A] outline-none transition-colors focus:border-[#1C3829] focus:bg-white"
          />
        </div>
      )}

      {error && <p className="mt-3 text-sm text-[#C0392B]">{error}</p>}

      <button
        type="button"
        disabled={!selectedDay || !selectedTime || status === 'submitting'}
        onClick={handleConfirm}
        className="mt-6 w-full rounded-lg bg-[#111111] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#1C3829] disabled:cursor-not-allowed disabled:opacity-40"
      >
        {status === 'submitting' ? 'Booking…' : 'Confirm Booking'}
      </button>
    </div>
  )
}

export default function ClaimAccessSection() {
  return (
    <section id="claim-access" className="scroll-mt-24 bg-[#16241A] px-6 py-20 lg:py-24">
      <div className="mx-auto max-w-6xl">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <h2 className="font-heading text-3xl font-bold text-white sm:text-4xl">
              Claim Your Founding Access
            </h2>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-white/60">
              Only 560 founding spots exist. Once your neighbourhood hits its 5-agent cap, it&apos;s
              closed.
            </p>
            <div className="mt-8">
              <ReserveForm />
            </div>
          </div>

          <DiscoveryCallCard />
        </div>

        <div className="mt-12 flex flex-col items-center gap-2 border-t border-white/10 pt-8 text-center text-sm text-white/60 sm:flex-row sm:justify-center sm:gap-8">
          <a href="#claim-access" className="hover:text-white transition-colors">
            Prefer to chat first? Book 15 minutes with Tom
          </a>
          <a href="mailto:team@vicinus.ca" className="hover:text-white transition-colors">
            Bringing a team? Let&apos;s talk team access
          </a>
        </div>
      </div>
    </section>
  )
}
