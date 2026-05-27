'use client'

// FE-405: MortgageAnalysis — payment calculator widget
// Forest green #1C3829 background — intentionally dark
import { useState, useMemo } from 'react'
import { DollarSign, Percent, Calendar } from 'lucide-react'

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

export default function MortgageAnalysis({ price }: MortgageAnalysisProps) {
  const [downPct, setDownPct] = useState(20)
  const [ratePct, setRatePct] = useState(5.5)
  const [amortYears, setAmortYears] = useState(25)

  const { downAmount, principal, monthly, totalInterest } = useMemo(() => {
    const downAmount = Math.round(price * (downPct / 100))
    const principal = price - downAmount
    const monthly = calcMonthlyPayment(principal, ratePct, amortYears)
    const totalInterest = monthly * amortYears * 12 - principal
    return { downAmount, principal, monthly, totalInterest }
  }, [price, downPct, ratePct, amortYears])

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
        </div>
        <div className="text-right">
          <p className="font-heading text-4xl font-bold text-white">
            {fmt(monthly)}
          </p>
          <p className="text-white/50 text-xs mt-1">per month</p>
        </div>
      </div>

      {/* ── Breakdown pills ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        {[
          { label: 'Principal', value: fmt(principal) },
          { label: 'Down Payment', value: fmt(downAmount) },
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
