'use client'

// FE-405: MortgageAnalysis — payment calculator widget
// Forest green #1C3829 background — intentionally dark
import { useState, useMemo } from 'react'
import { DollarSign, Percent, Calendar, Home } from 'lucide-react'

interface MortgageAnalysisProps {
  price: number
}

function calcMonthlyPayment(
  principal: number,
  annualRatePct: number,
  amortYears: number,
): number {
  const r = annualRatePct / 100 / 12
  const n = amortYears * 12
  if (r === 0) return principal / n
  return (principal * (r * Math.pow(1 + r, n))) / (Math.pow(1 + r, n) - 1)
}

/**
 * BC Property Transfer Tax on the fair market value:
 *   1% on the first $200,000, 2% on $200,000–$2,000,000, 3% above $2,000,000,
 *   plus an additional 2% on the residential portion above $3,000,000.
 */
function calcBcPtt(value: number): number {
  if (value <= 0) return 0
  let tax = 0
  tax += Math.min(value, 200_000) * 0.01
  if (value > 200_000) tax += (Math.min(value, 2_000_000) - 200_000) * 0.02
  if (value > 2_000_000) tax += (value - 2_000_000) * 0.03
  if (value > 3_000_000) tax += (value - 3_000_000) * 0.02
  return Math.round(tax)
}

export default function MortgageAnalysis({ price }: MortgageAnalysisProps) {
  // PDP-06: seed the calculator with the listing's asking price, but let the
  // user edit it (empty string while typing → treated as 0).
  const [homePrice, setHomePrice] = useState<number>(price > 0 ? price : 0)
  const [downPct, setDownPct] = useState(20)
  const [ratePct, setRatePct] = useState(5.5)
  const [amortYears, setAmortYears] = useState(25)
  const [includePtt, setIncludePtt] = useState(true)

  const { downAmount, principal, monthly, totalInterest, ptt, cashAtClosing } = useMemo(() => {
    const downAmount = Math.round(homePrice * (downPct / 100))
    const principal = Math.max(homePrice - downAmount, 0)
    const monthly = calcMonthlyPayment(principal, ratePct, amortYears)
    const totalInterest = monthly * amortYears * 12 - principal
    const ptt = includePtt ? calcBcPtt(homePrice) : 0
    const cashAtClosing = downAmount + ptt
    return { downAmount, principal, monthly, totalInterest, ptt, cashAtClosing }
  }, [homePrice, downPct, ratePct, amortYears, includePtt])

  function fmt(n: number) {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
      maximumFractionDigits: 0,
    }).format(n)
  }

  return (
    <section
      className="rounded-2xl p-8 text-white"
      style={{ background: '#1C3829' }}
    >
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="font-heading text-xl font-semibold text-white/90 mb-1">
            Mortgage Analysis
          </h2>
          <p className="text-white/50 text-xs">Estimated monthly payment</p>
          {price > 0 && (
            <p className="text-white/40 text-[10px] mt-1">
              Based on the {fmt(price)} listing price
            </p>
          )}
        </div>
        <div className="text-right">
          <p className="font-heading text-4xl font-bold text-white">
            {fmt(monthly)}
          </p>
          <p className="text-white/50 text-xs mt-1">per month</p>
        </div>
      </div>

      {/* ── Home price (editable, defaults to asking price) ─────────────── */}
      <div className="mb-6">
        <label className="flex items-center gap-1.5 text-white/60 text-xs mb-2">
          <Home size={11} />
          Home price
        </label>
        <div className="flex items-center gap-2 bg-white/10 rounded-xl px-4 py-2.5 focus-within:ring-1 focus-within:ring-white/40">
          <span className="text-white/60 text-sm">$</span>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            step={1000}
            value={homePrice === 0 ? '' : homePrice}
            onChange={(e) => setHomePrice(e.target.value === '' ? 0 : Math.max(Number(e.target.value), 0))}
            placeholder="Asking price"
            className="flex-1 bg-transparent text-white font-semibold text-lg outline-none placeholder:text-white/30 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          {price > 0 && homePrice !== price && (
            <button
              onClick={() => setHomePrice(price)}
              className="text-white/60 text-[11px] underline hover:text-white shrink-0"
            >
              Reset to asking
            </button>
          )}
        </div>
      </div>

      {/* ── Breakdown pills ─────────────────────────────────────────────── */}
      <div className={`grid gap-3 mb-6 ${includePtt ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-3'}`}>
        {[
          { label: 'Principal', value: fmt(principal) },
          { label: 'Down Payment', value: fmt(downAmount) },
          ...(includePtt ? [{ label: 'Property Transfer Tax', value: fmt(ptt) }] : []),
          { label: 'Total Interest', value: fmt(Math.round(totalInterest)) },
        ].map((item) => (
          <div
            key={item.label}
            className="bg-white/10 rounded-xl px-4 py-3 text-center"
          >
            <p className="text-white font-semibold text-sm">{item.value}</p>
            <p className="text-white/50 text-[10px] mt-0.5">{item.label}</p>
          </div>
        ))}
      </div>

      {/* ── PTT toggle + cash-at-closing ────────────────────────────────── */}
      <div className="flex items-center justify-between mb-8">
        <label className="flex items-center gap-2 text-white/70 text-xs cursor-pointer select-none">
          <input
            type="checkbox"
            checked={includePtt}
            onChange={(e) => setIncludePtt(e.target.checked)}
            className="accent-white w-3.5 h-3.5"
          />
          Include BC Property Transfer Tax
        </label>
        {includePtt && (
          <p className="text-white/70 text-xs">
            Cash at closing{' '}
            <span className="text-white font-semibold">{fmt(cashAtClosing)}</span>
          </p>
        )}
      </div>

      {/* ── Inputs ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        {/* Down payment slider */}
        <div>
          <label className="flex items-center gap-1.5 text-white/60 text-xs mb-2">
            <Percent size={11} />
            Down Payment — {downPct}%
          </label>
          <input
            type="range"
            min={5}
            max={50}
            step={1}
            value={downPct}
            onChange={(e) => setDownPct(Number(e.target.value))}
            className="w-full h-1.5 rounded-full appearance-none bg-white/20 accent-white cursor-pointer"
          />
          <div className="flex justify-between text-white/40 text-[10px] mt-1">
            <span>5%</span><span>50%</span>
          </div>
        </div>

        {/* Interest rate */}
        <div>
          <label className="flex items-center gap-1.5 text-white/60 text-xs mb-2">
            <DollarSign size={11} />
            Interest Rate — {ratePct.toFixed(2)}%
          </label>
          <input
            type="range"
            min={2}
            max={10}
            step={0.05}
            value={ratePct}
            onChange={(e) => setRatePct(Number(e.target.value))}
            className="w-full h-1.5 rounded-full appearance-none bg-white/20 accent-white cursor-pointer"
          />
          <div className="flex justify-between text-white/40 text-[10px] mt-1">
            <span>2%</span><span>10%</span>
          </div>
        </div>

        {/* Amortization */}
        <div>
          <label className="flex items-center gap-1.5 text-white/60 text-xs mb-2">
            <Calendar size={11} />
            Amortization — {amortYears} yrs
          </label>
          <input
            type="range"
            min={10}
            max={30}
            step={5}
            value={amortYears}
            onChange={(e) => setAmortYears(Number(e.target.value))}
            className="w-full h-1.5 rounded-full appearance-none bg-white/20 accent-white cursor-pointer"
          />
          <div className="flex justify-between text-white/40 text-[10px] mt-1">
            <span>10 yr</span><span>30 yr</span>
          </div>
        </div>
      </div>

      {/* ── CTA ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button className="flex-1 bg-white text-[#1C3829] font-semibold text-sm py-3 px-6 rounded-xl hover:bg-white/95 transition-colors">
          Get Pre-Approved
        </button>
        <button className="flex-1 border border-white/30 text-white font-medium text-sm py-3 px-6 rounded-xl hover:bg-white/10 transition-colors">
          Connect with Agent
        </button>
      </div>

      {/* ── Disclaimer ──────────────────────────────────────────────────── */}
      <p className="text-white/30 text-[10px] mt-4 leading-relaxed">
        Estimates are for illustrative purposes only. Actual payments may vary based on lender requirements, taxes, and insurance. Consult a licensed mortgage professional.
      </p>
    </section>
  )
}
