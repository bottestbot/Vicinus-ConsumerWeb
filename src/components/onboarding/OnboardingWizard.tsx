'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Home, Tag, KeyRound, Compass, Clock, Calendar, CalendarDays, Search,
  GraduationCap, Car, Train, TreePine, UtensilsCrossed, Footprints, VolumeX,
  MoreHorizontal, Building2, LayoutGrid, DoorOpen, Sparkles, CheckCircle2,
  ChevronLeft, ChevronRight, X, Landmark, UserCheck,
} from 'lucide-react'
import { updateOnboarding } from '@/lib/api/users'
import Logo from '@/components/brand/Logo'

// ─── Types ────────────────────────────────────────────────────────────────────

interface OnboardingData {
  goal?: string
  timeline?: string
  neighbourhoods?: string[]
  openToNearby?: boolean
  lifestylePriorities?: string[]
  homeType?: string
  budget?: string
  bedrooms?: string
  mortgage?: string
  workingWithRealtor?: string
}

interface WizardProps {
  onComplete: () => void
  onSkip: () => void
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────

function ProgressBar({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`h-0.5 flex-1 rounded-full transition-all duration-300 ${
            i < step ? 'bg-[#1C3829]' : 'bg-[#D9D6CF]'
          }`}
        />
      ))}
    </div>
  )
}

// ─── Icon Tile (goal / home type) ─────────────────────────────────────────────

function IconTile({
  icon,
  label,
  selected,
  onClick,
}: {
  icon: React.ReactNode
  label: string
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center gap-2.5 rounded-2xl border p-5 transition-all duration-150 ${
        selected
          ? 'border-[#1C3829] bg-[#1C3829]/5 ring-1 ring-[#1C3829]'
          : 'border-[#E8E6E1] bg-white hover:border-[#1C3829]/40'
      }`}
    >
      <span className={`${selected ? 'text-[#1C3829]' : 'text-[#6B6B6B]'}`}>{icon}</span>
      <span className={`text-xs font-bold uppercase tracking-widest ${selected ? 'text-[#1C3829]' : 'text-[#6B6B6B]'}`}>
        {label}
      </span>
    </button>
  )
}

// ─── Timeline Card ────────────────────────────────────────────────────────────

function TimelineCard({
  icon,
  label,
  selected,
  onClick,
}: {
  icon: React.ReactNode
  label: string
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 rounded-xl border px-4 py-3.5 text-sm font-medium transition-all duration-150 ${
        selected
          ? 'border-[#1C3829] bg-[#1C3829]/5 text-[#1C3829] ring-1 ring-[#1C3829]'
          : 'border-[#E8E6E1] bg-white text-[#3D3D3D] hover:border-[#1C3829]/40'
      }`}
    >
      <span className={selected ? 'text-[#1C3829]' : 'text-[#6B6B6B]'}>{icon}</span>
      {label}
    </button>
  )
}

// ─── Option Card (open to nearby / mortgage / realtor) ────────────────────────

function OptionCard({
  title,
  subtitle,
  selected,
  onClick,
}: {
  title: string
  subtitle?: string
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full rounded-xl border p-4 text-left transition-all duration-150 ${
        selected
          ? 'border-[#1C3829] bg-[#1C3829]/5 ring-1 ring-[#1C3829]'
          : 'border-[#E8E6E1] bg-white hover:border-[#1C3829]/40'
      }`}
    >
      <p className={`font-semibold text-sm ${selected ? 'text-[#1C3829]' : 'text-[#111111]'}`}>{title}</p>
      {subtitle && <p className="text-xs text-[#6B6B6B] mt-0.5">{subtitle}</p>}
    </button>
  )
}

// ─── Lifestyle Tile ───────────────────────────────────────────────────────────

function LifestyleTile({
  icon,
  label,
  subtitle,
  selected,
  onClick,
  disabled,
}: {
  icon: React.ReactNode
  label: string
  subtitle: string
  selected: boolean
  onClick: () => void
  disabled: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled && !selected}
      className={`flex flex-col gap-2 rounded-xl border p-4 text-left transition-all duration-150 ${
        selected
          ? 'border-[#1C3829] bg-[#1C3829]/5 ring-1 ring-[#1C3829]'
          : disabled
          ? 'border-[#E8E6E1] bg-[#F9F8F5] opacity-50 cursor-not-allowed'
          : 'border-[#E8E6E1] bg-white hover:border-[#1C3829]/40'
      }`}
    >
      <span className={selected ? 'text-[#1C3829]' : 'text-[#6B6B6B]'}>{icon}</span>
      <div>
        <p className={`text-sm font-semibold ${selected ? 'text-[#1C3829]' : 'text-[#111111]'}`}>{label}</p>
        <p className="text-xs text-[#6B6B6B] mt-0.5">{subtitle}</p>
      </div>
    </button>
  )
}

// ─── Nav bar (steps 2-5) ──────────────────────────────────────────────────────

function StepNav({ step, total, onSaveExit }: { step: number; total: number; onSaveExit: () => void }) {
  return (
    <div className="flex items-center justify-between px-6 py-4 border-b border-[#E8E6E1]">
      <Logo className="text-lg" />
      <div className="flex-1 mx-10">
        <div className="flex items-center gap-1 mb-1">
          <span className="text-[10px] font-bold text-[#6B6B6B] uppercase tracking-widest">
            Step {step} of {total}
          </span>
        </div>
        <ProgressBar step={step} total={total} />
      </div>
      <button
        onClick={onSaveExit}
        className="text-[11px] font-bold uppercase tracking-widest text-[#6B6B6B] hover:text-[#1C3829] transition-colors"
      >
        Save & Exit
      </button>
    </div>
  )
}

// ─── Step 1: The Basics ───────────────────────────────────────────────────────

function Step1({
  data,
  onChange,
  onNext,
  onSkip,
}: {
  data: OnboardingData
  onChange: (d: Partial<OnboardingData>) => void
  onNext: () => void
  onSkip: () => void
}) {
  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden md:flex w-[420px] shrink-0 bg-[#1C3829] flex-col justify-between p-10">
        <Logo variant="light" className="text-2xl" />
        <div>
          <p className="font-heading text-3xl font-bold text-white leading-snug mb-4">
            An intelligent curator for your real estate journey.
          </p>
          <p className="text-[#A8C4B0] text-sm leading-relaxed">
            We believe the home search should feel like an editorial experience — refined, intentional, and effortless.
          </p>
          <div className="flex items-center gap-3 mt-6">
            <div className="w-8 h-px bg-[#4A7A5A]" />
            <span className="text-[10px] font-bold tracking-widest text-[#4A7A5A] uppercase">The Intelligent Curator</span>
          </div>
        </div>
        <div />
      </div>

      {/* Right panel */}
      <div className="flex-1 bg-[#F5F3EE] flex flex-col">
        {/* Step indicator */}
        <div className="px-8 pt-8 pb-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-bold text-[#6B6B6B] uppercase tracking-widest">Step 1 of 5</span>
            <span className="text-[10px] text-[#9B9B9B]">· The Basics</span>
          </div>
          <ProgressBar step={1} total={5} />
        </div>

        <div className="flex-1 overflow-y-auto px-8 py-8 space-y-10">
          <h1 className="font-heading text-3xl font-bold text-[#111111] leading-tight">
            Let&apos;s customize your experience.<br />What are your real estate goals?
          </h1>

          {/* Q1 */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <span className="w-7 h-7 rounded-full border border-[#D9D6CF] flex items-center justify-center text-xs font-bold text-[#6B6B6B]">01</span>
              <p className="text-sm font-medium text-[#3D3D3D]">Are you looking to buy, sell, rent, or just exploring the market?</p>
            </div>
            <div className="grid grid-cols-4 gap-3">
              {[
                { key: 'buy', label: 'Buy', icon: <Home size={22} /> },
                { key: 'sell', label: 'Sell', icon: <Tag size={22} /> },
                { key: 'rent', label: 'Rent', icon: <KeyRound size={22} /> },
                { key: 'exploring', label: 'Just Exploring', icon: <Compass size={22} /> },
              ].map((o) => (
                <IconTile
                  key={o.key}
                  icon={o.icon}
                  label={o.label}
                  selected={data.goal === o.key}
                  onClick={() => onChange({ goal: o.key })}
                />
              ))}
            </div>
          </div>

          {/* Q2 */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <span className="w-7 h-7 rounded-full border border-[#D9D6CF] flex items-center justify-center text-xs font-bold text-[#6B6B6B]">02</span>
              <p className="text-sm font-medium text-[#3D3D3D]">How soon are you looking to make a move?</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { key: '3mo', label: 'Within 3 months', icon: <Clock size={16} /> },
                { key: '3-6mo', label: '3–6 months', icon: <Calendar size={16} /> },
                { key: '6-12mo', label: '6–12 months', icon: <CalendarDays size={16} /> },
                { key: 'researching', label: 'Just researching', icon: <Search size={16} /> },
              ].map((o) => (
                <TimelineCard
                  key={o.key}
                  icon={o.icon}
                  label={o.label}
                  selected={data.timeline === o.key}
                  onClick={() => onChange({ timeline: o.key })}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-6 border-t border-[#E8E6E1] flex items-center justify-between bg-[#F5F3EE]">
          <button onClick={onSkip} className="text-sm text-[#6B6B6B] hover:text-[#111111] transition-colors">
            Skip for now
          </button>
          <button
            onClick={onNext}
            className="flex items-center gap-2 bg-[#1C3829] text-white text-sm font-bold px-6 py-3 rounded-xl hover:bg-[#2D5A3D] transition-colors"
          >
            Next: Location &amp; Lifestyle <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Step 2: Location & Lifestyle ─────────────────────────────────────────────

const LIFESTYLE_OPTIONS = [
  { key: 'schools', label: 'Top Schools', subtitle: 'Excellence in education proximity.', icon: <GraduationCap size={22} /> },
  { key: 'commute', label: 'Easy Commute', subtitle: 'Quick highway & road access.', icon: <Car size={22} /> },
  { key: 'transit', label: 'Near Transit', subtitle: 'Skytrain & bus accessibility.', icon: <Train size={22} /> },
  { key: 'parks', label: 'Parks & Outdoors', subtitle: 'Proximity to green spaces.', icon: <TreePine size={22} /> },
  { key: 'dining', label: 'Dining & Nightlife', subtitle: 'Vibrant food scene & bars.', icon: <UtensilsCrossed size={22} /> },
  { key: 'walkability', label: 'High Walkability', subtitle: 'Daily errands on foot.', icon: <Footprints size={22} /> },
  { key: 'quiet', label: 'Quiet & Peaceful', subtitle: 'Minimal traffic and noise.', icon: <VolumeX size={22} /> },
  { key: 'more', label: 'More Coming Soon', subtitle: '', icon: <MoreHorizontal size={22} /> },
]

const NEIGHBOURHOOD_SUGGESTIONS = ['Port Moody', 'Coquitlam', 'North Vancouver', 'Burnaby', 'New Westminster', 'Richmond']

function Step2({
  data,
  onChange,
  onNext,
  onBack,
  onSaveExit,
}: {
  data: OnboardingData
  onChange: (d: Partial<OnboardingData>) => void
  onNext: () => void
  onBack: () => void
  onSaveExit: () => void
}) {
  const [inputVal, setInputVal] = useState('')
  const hoods = data.neighbourhoods ?? []
  const priorities = data.lifestylePriorities ?? []
  const MAX_PRIORITIES = 3

  function addHood(name: string) {
    const trimmed = name.trim()
    if (!trimmed || hoods.includes(trimmed)) return
    onChange({ neighbourhoods: [...hoods, trimmed] })
    setInputVal('')
  }

  function removeHood(name: string) {
    onChange({ neighbourhoods: hoods.filter((h) => h !== name) })
  }

  function togglePriority(key: string) {
    if (key === 'more') return
    if (priorities.includes(key)) {
      onChange({ lifestylePriorities: priorities.filter((p) => p !== key) })
    } else if (priorities.length < MAX_PRIORITIES) {
      onChange({ lifestylePriorities: [...priorities, key] })
    }
  }

  return (
    <div className="min-h-screen bg-[#F5F3EE] flex flex-col">
      <StepNav step={2} total={5} onSaveExit={onSaveExit} />

      <div className="flex-1 overflow-y-auto max-w-3xl mx-auto w-full px-6 py-10 space-y-10">
        <div>
          <h1 className="font-heading text-4xl font-bold text-[#111111] mb-2">Tell us about your ideal vibe.</h1>
          <p className="text-[#6B6B6B] text-sm">
            Your location defines your lifestyle. Let&apos;s narrow down the patches of the city that feel like home to you.
          </p>
        </div>

        {/* Q1: Neighbourhoods */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <span className="w-7 h-7 rounded-full bg-[#1C3829]/10 flex items-center justify-center text-xs font-bold text-[#1C3829]">01</span>
            <p className="font-semibold text-[#111111]">Which neighbourhoods or areas are you most interested in?</p>
          </div>
          <div className="flex flex-wrap gap-2 mb-3">
            {hoods.map((h) => (
              <span key={h} className="flex items-center gap-1.5 bg-white border border-[#D9D6CF] text-sm text-[#111111] px-3 py-1.5 rounded-full">
                {h}
                <button onClick={() => removeHood(h)} className="text-[#9B9B9B] hover:text-red-500">
                  <X size={12} />
                </button>
              </span>
            ))}
            <div className="flex items-center gap-1.5 border border-dashed border-[#C8C4BC] rounded-full px-3 py-1.5">
              <input
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addHood(inputVal)}
                placeholder="+ Add Area"
                className="bg-transparent text-sm text-[#6B6B6B] placeholder:text-[#9B9B9B] outline-none w-28"
              />
            </div>
          </div>
          {/* Suggestions */}
          <div className="flex flex-wrap gap-2">
            {NEIGHBOURHOOD_SUGGESTIONS.filter((s) => !hoods.includes(s)).map((s) => (
              <button
                key={s}
                onClick={() => addHood(s)}
                className="text-xs text-[#6B6B6B] border border-[#E8E6E1] px-2.5 py-1 rounded-full hover:border-[#1C3829] hover:text-[#1C3829] transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Q2: Open to nearby */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <span className="w-7 h-7 rounded-full bg-[#1C3829]/10 flex items-center justify-center text-xs font-bold text-[#1C3829]">02</span>
            <p className="font-semibold text-[#111111]">Are you open to nearby areas if the right property came up?</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <OptionCard
              title="Yes, show me options"
              subtitle="Our curator will suggest high-value matches in adjacent zones."
              selected={data.openToNearby === true}
              onClick={() => onChange({ openToNearby: true })}
            />
            <OptionCard
              title="No, I'm set on these areas"
              subtitle="Strict adherence to your selected boundaries only."
              selected={data.openToNearby === false}
              onClick={() => onChange({ openToNearby: false })}
            />
          </div>
        </div>

        {/* Q3: Lifestyle */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <span className="w-7 h-7 rounded-full bg-[#1C3829]/10 flex items-center justify-center text-xs font-bold text-[#1C3829]">03</span>
            <p className="font-semibold text-[#111111]">
              What matters most to you?{' '}
              <span className="text-[#6B6B6B] font-normal">(Pick up to {MAX_PRIORITIES})</span>
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {LIFESTYLE_OPTIONS.map((o) => (
              <LifestyleTile
                key={o.key}
                icon={o.icon}
                label={o.label}
                subtitle={o.subtitle}
                selected={priorities.includes(o.key)}
                onClick={() => togglePriority(o.key)}
                disabled={priorities.length >= MAX_PRIORITIES && !priorities.includes(o.key)}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-[#E8E6E1] px-6 py-5 flex items-center justify-between bg-[#F5F3EE]">
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm font-bold uppercase tracking-widest text-[#6B6B6B] hover:text-[#111111]">
          <ChevronLeft size={16} /> Back
        </button>
        <button
          onClick={onNext}
          className="flex items-center gap-2 bg-[#1C3829] text-white text-sm font-bold px-6 py-3 rounded-xl hover:bg-[#2D5A3D] transition-colors"
        >
          Next: Property Specs <ChevronRight size={16} />
        </button>
      </div>
    </div>
  )
}

// ─── Step 3: Property Specs ───────────────────────────────────────────────────

const HOME_TYPES = [
  { key: 'condo', label: 'Condo', icon: <Building2 size={24} /> },
  { key: 'townhouse', label: 'Townhouse', icon: <LayoutGrid size={24} /> },
  { key: 'detached', label: 'Detached', icon: <Home size={24} /> },
  { key: 'presale', label: 'Presale', icon: <Sparkles size={24} /> },
  { key: 'any', label: 'Open to all', icon: <DoorOpen size={24} /> },
]

const BUDGETS = ['Under $600K', '$600K–$1M', '$1M–$2M', '$2M+']
const BEDROOMS = ['1+', '2+', '3+', '4+']

function Step3({
  data,
  onChange,
  onNext,
  onBack,
  onSaveExit,
}: {
  data: OnboardingData
  onChange: (d: Partial<OnboardingData>) => void
  onNext: () => void
  onBack: () => void
  onSaveExit: () => void
}) {
  return (
    <div className="min-h-screen bg-[#F5F3EE] flex flex-col">
      <StepNav step={3} total={5} onSaveExit={onSaveExit} />

      <div className="flex-1 overflow-y-auto max-w-3xl mx-auto w-full px-6 py-10 space-y-10">
        <div>
          <h1 className="font-heading text-4xl font-bold text-[#111111]">What does your dream home look like?</h1>
          <div className="mt-3 h-0.5 w-40 bg-[#1C3829]" />
        </div>

        {/* Home type */}
        <div>
          <p className="font-semibold text-[#111111] mb-4">What type of home are you looking for?</p>
          <div className="grid grid-cols-5 gap-3">
            {HOME_TYPES.map((t) => (
              <IconTile
                key={t.key}
                icon={t.icon}
                label={t.label}
                selected={data.homeType === t.key}
                onClick={() => onChange({ homeType: t.key })}
              />
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-10">
          {/* Budget */}
          <div>
            <p className="font-semibold text-[#111111] mb-4">What&apos;s your target budget range?</p>
            <div className="space-y-2">
              {BUDGETS.map((b) => (
                <button
                  key={b}
                  onClick={() => onChange({ budget: b })}
                  className={`w-full flex items-center gap-3 rounded-xl border px-4 py-3 text-sm transition-all duration-150 ${
                    data.budget === b
                      ? 'border-[#1C3829] bg-[#1C3829]/5 text-[#1C3829] ring-1 ring-[#1C3829]'
                      : 'border-[#E8E6E1] bg-white text-[#3D3D3D] hover:border-[#1C3829]/40'
                  }`}
                >
                  <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    data.budget === b ? 'border-[#1C3829]' : 'border-[#C8C4BC]'
                  }`}>
                    {data.budget === b && <span className="w-2 h-2 rounded-full bg-[#1C3829]" />}
                  </span>
                  {b}
                </button>
              ))}
            </div>
          </div>

          {/* Bedrooms */}
          <div>
            <p className="font-semibold text-[#111111] mb-4">How many bedrooms?</p>
            <div className="grid grid-cols-2 gap-2">
              {BEDROOMS.map((b) => (
                <button
                  key={b}
                  onClick={() => onChange({ bedrooms: b })}
                  className={`rounded-xl border py-4 text-sm font-bold transition-all duration-150 ${
                    data.bedrooms === b
                      ? 'border-[#1C3829] bg-[#1C3829] text-white'
                      : 'border-[#E8E6E1] bg-white text-[#3D3D3D] hover:border-[#1C3829]/40'
                  }`}
                >
                  {b}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-[#E8E6E1] px-6 py-5 flex items-center justify-between bg-[#F5F3EE]">
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm font-bold uppercase tracking-widest text-[#6B6B6B] hover:text-[#111111]">
          <ChevronLeft size={16} /> Previous Step
        </button>
        <button
          onClick={onNext}
          className="flex items-center gap-2 bg-[#1C3829] text-white text-sm font-bold px-6 py-3 rounded-xl hover:bg-[#2D5A3D] transition-colors"
        >
          Next: Buyer Readiness <ChevronRight size={16} />
        </button>
      </div>
    </div>
  )
}

// ─── Step 4: Buyer Readiness ──────────────────────────────────────────────────

const MORTGAGE_OPTIONS = [
  { key: 'approved', label: 'Yes, all set' },
  { key: 'in_progress', label: 'In progress' },
  { key: 'not_yet', label: 'No, not yet' },
  { key: 'cash', label: 'Paying cash 💰' },
]

const REALTOR_OPTIONS = [
  { key: 'yes', label: 'Yes' },
  { key: 'no', label: 'No' },
  { key: 'open', label: 'Open to connecting with the right one' },
]

function Step4({
  data,
  onChange,
  onNext,
  onBack,
  onSaveExit,
}: {
  data: OnboardingData
  onChange: (d: Partial<OnboardingData>) => void
  onNext: () => void
  onBack: () => void
  onSaveExit: () => void
}) {
  return (
    <div className="min-h-screen bg-[#F5F3EE] flex flex-col">
      <StepNav step={4} total={5} onSaveExit={onSaveExit} />

      <div className="flex-1 overflow-y-auto max-w-5xl mx-auto w-full px-6 py-10">
        <div className="grid md:grid-cols-2 gap-12 items-start">
          {/* Left */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-[#1C3829] mb-3">Buyer Readiness</p>
            <h1 className="font-heading text-4xl font-bold text-[#111111] leading-tight mb-6">
              Help us match you with the right opportunities.
            </h1>
            <div className="text-sm text-[#6B6B6B] mb-4">Step 4 of 5</div>
            <div className="w-full bg-[#E8E6E1] rounded-full h-1 mb-1">
              <div className="bg-[#1C3829] h-1 rounded-full" style={{ width: '80%' }} />
            </div>
            <div className="text-right text-xs font-bold text-[#1C3829]">80%</div>

            <div className="mt-8 rounded-2xl overflow-hidden h-48 bg-[#D9D6CF]">
              <img
                src="https://images.unsplash.com/photo-1600210491369-e753d80a41f3?w=600&q=80"
                alt="Interior"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Right */}
          <div className="space-y-8">
            {/* Mortgage */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <span className="w-8 h-8 rounded-full bg-[#1C3829]/10 flex items-center justify-center">
                  <Landmark size={16} className="text-[#1C3829]" />
                </span>
                <p className="font-semibold text-[#111111]">Have you been pre-approved for a mortgage?</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {MORTGAGE_OPTIONS.map((o) => (
                  <OptionCard
                    key={o.key}
                    title={o.label}
                    selected={data.mortgage === o.key}
                    onClick={() => onChange({ mortgage: o.key })}
                  />
                ))}
              </div>
            </div>

            {/* Realtor */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <span className="w-8 h-8 rounded-full bg-[#1C3829]/10 flex items-center justify-center">
                  <UserCheck size={16} className="text-[#1C3829]" />
                </span>
                <p className="font-semibold text-[#111111]">Are you currently working with a Realtor?</p>
              </div>
              <div className="space-y-2">
                {REALTOR_OPTIONS.map((o) => (
                  <button
                    key={o.key}
                    onClick={() => onChange({ workingWithRealtor: o.key })}
                    className={`w-full flex items-center justify-between rounded-xl border px-4 py-3.5 text-sm transition-all duration-150 ${
                      data.workingWithRealtor === o.key
                        ? 'border-[#1C3829] bg-[#1C3829]/5 text-[#1C3829] ring-1 ring-[#1C3829]'
                        : 'border-[#E8E6E1] bg-white text-[#3D3D3D] hover:border-[#1C3829]/40'
                    }`}
                  >
                    {o.label}
                    <span className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center ${
                      data.workingWithRealtor === o.key ? 'border-[#1C3829]' : 'border-[#C8C4BC]'
                    }`}>
                      {data.workingWithRealtor === o.key && <span className="w-2 h-2 rounded-full bg-[#1C3829]" />}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-[#E8E6E1] px-6 py-5 flex items-center justify-between bg-[#F5F3EE]">
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm font-medium text-[#6B6B6B] hover:text-[#111111]">
          <ChevronLeft size={16} /> Back
        </button>
        <button
          onClick={onNext}
          className="flex items-center gap-2 bg-[#6DBF67] text-white text-sm font-bold px-6 py-3 rounded-xl hover:bg-[#5aad55] transition-colors"
        >
          Next: Final Step <ChevronRight size={16} />
        </button>
      </div>
    </div>
  )
}

// ─── Step 5: Complete ─────────────────────────────────────────────────────────

function Step5({ onComplete, saving }: { onComplete: () => void; saving: boolean }) {
  return (
    <div className="min-h-screen bg-[#F5F3EE] flex flex-col items-center justify-center px-6 text-center">
      <div className="w-16 h-16 rounded-full bg-[#1C3829]/10 flex items-center justify-center mb-6">
        <CheckCircle2 size={32} className="text-[#1C3829]" />
      </div>
      <h1 className="font-heading text-4xl font-bold text-[#111111] mb-3">You&apos;re all set.</h1>
      <p className="text-[#6B6B6B] max-w-sm mb-10">
        Your curator profile is ready. We&apos;ll use your preferences to surface the listings that actually match your vision.
      </p>
      <button
        onClick={onComplete}
        disabled={saving}
        className="flex items-center gap-2 bg-[#1C3829] text-white text-sm font-bold px-8 py-4 rounded-xl hover:bg-[#2D5A3D] transition-colors disabled:opacity-60"
      >
        {saving ? 'Saving…' : 'Go to my Dashboard'} <ChevronRight size={16} />
      </button>
    </div>
  )
}

// ─── Wizard ───────────────────────────────────────────────────────────────────

export default function OnboardingWizard({ onComplete, onSkip }: WizardProps) {
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState<OnboardingData>({})

  function update(partial: Partial<OnboardingData>) {
    setFormData((prev) => ({ ...prev, ...partial }))
  }

  async function saveStep(stepData: Partial<OnboardingData>) {
    try {
      await updateOnboarding({ stepData: stepData as Record<string, unknown> })
    } catch {
      // non-blocking — don't halt the UX
    }
  }

  function next(stepData?: Partial<OnboardingData>) {
    if (stepData) {
      update(stepData)
      saveStep(stepData)
    }
    setStep((s) => s + 1)
  }

  async function complete() {
    setSaving(true)
    // Persisting `completed: true` is critical: the dashboard's server-side ping
    // redirects back to /onboarding whenever onboardingCompleted is still false.
    // If the first attempt fails (e.g. the Clerk token wasn't ready yet), retry
    // once before navigating so the wizard doesn't bounce back in a loop.
    let saved = false
    for (let attempt = 0; attempt < 2 && !saved; attempt++) {
      try {
        await updateOnboarding({ stepData: formData as Record<string, unknown>, completed: true })
        saved = true
      } catch {
        if (attempt === 0) await new Promise((r) => setTimeout(r, 600))
      }
    }
    setSaving(false)
    onComplete()
  }

  async function handleSaveExit() {
    await saveStep(formData)
    onSkip()
  }

  if (step === 1) return <Step1 data={formData} onChange={update} onNext={() => next()} onSkip={onSkip} />
  if (step === 2) return <Step2 data={formData} onChange={update} onNext={() => next()} onBack={() => setStep(1)} onSaveExit={handleSaveExit} />
  if (step === 3) return <Step3 data={formData} onChange={update} onNext={() => next()} onBack={() => setStep(2)} onSaveExit={handleSaveExit} />
  if (step === 4) return <Step4 data={formData} onChange={update} onNext={() => next()} onBack={() => setStep(3)} onSaveExit={handleSaveExit} />
  return <Step5 onComplete={complete} saving={saving} />
}
