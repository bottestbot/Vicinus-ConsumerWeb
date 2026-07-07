'use client'

import { useState, useEffect } from 'react'
import {
  Banknote, Zap, ArrowLeftRight, Wrench, Home, Receipt, Rocket,
  Mail, PhoneCall, CalendarCheck, ArrowRight, ArrowLeft, Check, Sparkles, Loader2,
} from 'lucide-react'
import type { SellAnswers, SellPreviewRange } from '@/lib/api/sell'
import { getSellPreview } from '@/lib/api/sell'

interface Choice {
  key: string
  title: string
  desc: string
  icon: React.ReactNode
}

const PRIORITIES: Choice[] = [
  { key: 'maximize-profit', title: 'Maximize Profit', desc: 'I want every penny of equity, even if it takes a bit longer to find the right buyer.', icon: <Banknote size={22} /> },
  { key: 'speed-certainty', title: 'Speed & Certainty', desc: 'I want a quick, guaranteed sale with zero showings and total convenience.', icon: <Zap size={22} /> },
  { key: 'perfect-timing', title: 'Perfect Timing', desc: 'I need to coordinate selling this home with buying my next one seamlessly.', icon: <ArrowLeftRight size={22} /> },
]

const HURDLES: Choice[] = [
  { key: 'prep-repairs', title: 'Property Prep & Repairs', desc: 'Optimization for market value through strategic cosmetic updates or structural fixes.', icon: <Wrench size={20} /> },
  { key: 'next-home', title: 'Finding My Next Home First', desc: 'Bridge financing and buy-before-sell programs so you aren’t left between homes.', icon: <Home size={20} /> },
  { key: 'fees', title: 'Minimizing Fees & Commissions', desc: 'Transparent, high-intelligence models that preserve your equity without sacrificing service.', icon: <Receipt size={20} /> },
  { key: 'ready', title: 'None, I’m Ready to Roll', desc: 'Your property is staged, priced, and primed. You just need the world’s best exposure.', icon: <Rocket size={20} /> },
]

const ADVISORY: Choice[] = [
  { key: 'digital', title: 'Digital First', desc: 'Send a digital report to my email within minutes.', icon: <Mail size={20} /> },
  { key: 'phone', title: 'Quick Phone Review', desc: 'Let an expert call me to answer questions and verify details.', icon: <PhoneCall size={20} /> },
  { key: 'in-person', title: 'In-Person Assessment', desc: 'Schedule a walk-through for a firm, non-contingent cash offer.', icon: <CalendarCheck size={20} /> },
]

function formatM(n: number): string {
  return `$${(n / 1_000_000).toFixed(2)}M`
}

interface PreviewState {
  status: 'loading' | 'ready' | 'error'
  range?: SellPreviewRange
}

// Real, model-derived preliminary range fetched from the backend (POST /sell/preview).
// No lead is captured to produce it — the precise valuation with confidence score and
// comparables stays gated behind the lead-capture form below.
function PreliminaryEstimate({ address, preview }: { address: string; preview: PreviewState }) {
  // Degrade gracefully: if the preview couldn't be fetched, hide the estimate block
  // entirely rather than showing a fabricated number.
  if (preview.status === 'error') return null

  return (
    <div className="bg-[#1C2C1A] rounded-2xl p-7 max-w-xl mx-auto mb-6 text-center">
      <div className="flex items-center justify-center gap-2 mb-3">
        <Sparkles size={16} className="text-[#A3E635]" />
        <span className="text-[11px] font-bold uppercase tracking-widest text-[#A3E635]">
          Preliminary Estimate
        </span>
      </div>
      {preview.status === 'loading' || !preview.range ? (
        <div className="flex items-center justify-center gap-2 h-10 text-white/60">
          <Loader2 size={20} className="animate-spin" />
          <span className="text-sm">Estimating your home’s value…</span>
        </div>
      ) : (
        <p className="font-heading text-4xl font-bold text-white leading-tight">
          {formatM(preview.range.low)} – {formatM(preview.range.high)}
        </p>
      )}
      <p className="text-white/60 text-sm mt-3 max-w-sm mx-auto leading-relaxed">
        An early range for <span className="text-white/85 font-medium">{address}</span>, based on
        comparable market activity. Share your details below to unlock your full editorial-grade
        analysis with confidence score and comparables.
      </p>
    </div>
  )
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-[#6B6B6B] hover:text-[#1C3829] transition-colors"
    >
      <ArrowLeft size={16} /> Previous step
    </button>
  )
}

function ProgressHeader({ step }: { step: number }) {
  const pct = Math.round((step / 3) * 100)
  return (
    <div className="max-w-3xl mx-auto w-full mb-10">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-bold uppercase tracking-widest text-[#1C3829]">
          Step {step} of 3
        </span>
        <span className="text-sm font-semibold text-[#1C3829]">{pct}% Complete</span>
      </div>
      <div className="h-1 w-full rounded-full bg-[#E2DFD8] overflow-hidden">
        <div className="h-full bg-[#1C3829] rounded-full transition-all duration-300" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

function ChoiceCard({ choice, selected, onClick }: { choice: Choice; selected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col gap-3 rounded-2xl border p-6 text-left transition-all duration-150 ${
        selected
          ? 'border-[#1C3829] bg-[#1C3829] ring-1 ring-[#1C3829]'
          : 'border-[#E8E6E1] bg-white hover:border-[#1C3829]/40'
      }`}
    >
      <span
        className={`w-11 h-11 rounded-xl flex items-center justify-center ${
          selected ? 'bg-[#A3E635] text-[#111111]' : 'bg-[#1C3829]/8 text-[#1C3829]'
        }`}
      >
        {choice.icon}
      </span>
      <p className={`font-heading text-lg font-bold ${selected ? 'text-white' : 'text-[#111111]'}`}>
        {choice.title}
      </p>
      <p className={`text-sm leading-relaxed ${selected ? 'text-white/70' : 'text-[#6B6B6B]'}`}>
        {choice.desc}
      </p>
    </button>
  )
}

interface Props {
  address: string
  onComplete: (answers: Omit<SellAnswers, 'address'>) => void
  onBack: () => void
}

export default function SellWizard({ address, onComplete, onBack }: Props) {
  const [step, setStep] = useState(1)
  const [sellingPriority, setSellingPriority] = useState<string>()
  const [biggestHurdle, setBiggestHurdle] = useState<string>()
  const [advisoryPreference, setAdvisoryPreference] = useState<string>('phone')
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '' })
  const [preview, setPreview] = useState<PreviewState>({ status: 'loading' })

  // Fetch the real, model-derived preview range once the seller reaches step 3.
  // Runs only after priority/hurdle are chosen so the estimate reflects them.
  useEffect(() => {
    if (step !== 3) return
    let cancelled = false
    setPreview({ status: 'loading' })
    getSellPreview({ address, sellingPriority, biggestHurdle, advisoryPreference })
      .then((range) => {
        if (!cancelled) setPreview({ status: 'ready', range })
      })
      .catch(() => {
        if (!cancelled) setPreview({ status: 'error' })
      })
    return () => {
      cancelled = true
    }
    // Intentionally excludes advisoryPreference — it can change on step 3 without
    // needing to re-run the estimate, which depends mainly on address + priorities.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, address, sellingPriority, biggestHurdle])

  function prev() {
    if (step === 1) onBack()
    else setStep((s) => s - 1)
  }

  function submit() {
    onComplete({
      sellingPriority,
      biggestHurdle,
      advisoryPreference,
      firstName: form.firstName || undefined,
      lastName: form.lastName || undefined,
      email: form.email || undefined,
      phone: form.phone || undefined,
    })
  }

  return (
    <section className="min-h-screen bg-[#FAF9F6] px-6 pt-28 pb-20">
      <ProgressHeader step={step} />

      {/* Step 1 */}
      {step === 1 && (
        <div className="max-w-3xl mx-auto">
          <h1 className="font-heading text-4xl font-bold text-[#1C3829] leading-tight mb-3">
            What matters most to you in this selling process?
          </h1>
          <p className="text-[#6B6B6B] mb-8">
            Tailoring your experience requires understanding your primary motivation. Select the path that aligns with your goals.
          </p>
          <div className="grid sm:grid-cols-3 gap-5">
            {PRIORITIES.map((c) => (
              <ChoiceCard key={c.key} choice={c} selected={sellingPriority === c.key} onClick={() => { setSellingPriority(c.key); setStep(2) }} />
            ))}
          </div>
        </div>
      )}

      {/* Step 2 */}
      {step === 2 && (
        <div className="max-w-3xl mx-auto">
          <BackButton onClick={prev} />
          <h1 className="font-heading text-4xl font-bold text-[#1C3829] leading-tight mb-3">
            What is the biggest hurdle we can help you solve right now?
          </h1>
          <p className="text-[#6B6B6B] mb-8">We’re here to serve your specific needs and remove any friction.</p>
          <div className="grid sm:grid-cols-2 gap-5">
            {HURDLES.map((c) => (
              <ChoiceCard key={c.key} choice={c} selected={biggestHurdle === c.key} onClick={() => { setBiggestHurdle(c.key); setStep(3) }} />
            ))}
          </div>
        </div>
      )}

      {/* Step 3 */}
      {step === 3 && (
        <div className="max-w-3xl mx-auto">
          <BackButton onClick={prev} />
          <h1 className="font-heading text-4xl font-bold text-[#1C3829] leading-tight mb-3 text-center">
            How would you prefer to explore your home’s value and offers?
          </h1>
          <p className="text-[#6B6B6B] mb-8 text-center max-w-xl mx-auto">
            Choose the level of advisory that fits your comfort and schedule.
          </p>
          <div className="grid sm:grid-cols-3 gap-4 mb-10">
            {ADVISORY.map((c) => (
              <ChoiceCard key={c.key} choice={c} selected={advisoryPreference === c.key} onClick={() => setAdvisoryPreference(c.key)} />
            ))}
          </div>

          {/* Preliminary estimate — real model-derived range, shown BEFORE the lead-capture form */}
          <PreliminaryEstimate address={address} preview={preview} />

          {/* Lead form */}
          <div className="bg-white rounded-2xl border border-[#E8E6E1] p-8 max-w-xl mx-auto shadow-sm">
            <h2 className="font-heading text-2xl font-bold text-[#111111] text-center mb-6">
              Unlock your full analysis
            </h2>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <Field label="First Name" placeholder="John" value={form.firstName} onChange={(v) => setForm({ ...form, firstName: v })} />
              <Field label="Last Name" placeholder="Doe" value={form.lastName} onChange={(v) => setForm({ ...form, lastName: v })} />
            </div>
            <div className="mb-4">
              <Field label="Email Address" placeholder="john@example.com" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
            </div>
            <div className="mb-6">
              <Field label="Phone Number" placeholder="(555) 000-0000" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
            </div>
            <button
              onClick={submit}
              className="w-full flex items-center justify-center gap-2 bg-[#1C3829] text-white text-sm font-bold py-4 rounded-xl hover:bg-[#2D5A3D] transition-colors"
            >
              Unlock My Valuation Dashboard <Check size={16} />
            </button>
            <p className="text-[11px] text-[#9B9B9B] text-center mt-4 leading-relaxed">
              Valuation for <span className="font-medium text-[#6B6B6B]">{address}</span>. By continuing you agree to our terms of service and privacy policy.
            </p>
          </div>
        </div>
      )}

      {/* Footer nav */}
      <div className="max-w-3xl mx-auto mt-10 flex items-center justify-between">
        <button onClick={prev} className="flex items-center gap-1.5 text-sm font-semibold text-[#6B6B6B] hover:text-[#1C3829] transition-colors">
          <ArrowLeft size={16} /> {step === 1 ? 'Back to intro' : 'Previous step'}
        </button>
        {step < 3 && (
          <span className="text-xs text-[#9B9B9B]">Select an option to continue</span>
        )}
        {step === 3 && (
          <span className="flex items-center gap-1 text-xs text-[#9B9B9B]">
            <ArrowRight size={12} /> Fill in your details above
          </span>
        )}
      </div>
    </section>
  )
}

function Field({
  label, placeholder, value, onChange, type = 'text',
}: {
  label: string
  placeholder: string
  value: string
  onChange: (v: string) => void
  type?: string
}) {
  return (
    <label className="block">
      <span className="block text-[11px] font-bold uppercase tracking-widest text-[#6B6B6B] mb-1.5">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-[#F2F0EB] border border-transparent rounded-lg px-4 py-3 text-sm text-[#111111] placeholder-[#9B9B9B] focus:outline-none focus:border-[#1C3829]/30 transition-colors"
      />
    </label>
  )
}
