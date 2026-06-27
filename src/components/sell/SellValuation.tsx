'use client'

import { TrendingUp, ShieldCheck, ArrowRight, Bed, Bath, Square } from 'lucide-react'
import type { SellValuation } from '@/lib/api/sell'

function formatM(n: number): string {
  return `$${(n / 1_000_000).toFixed(2)}M`
}

export default function SellValuationView({ data }: { data: SellValuation }) {
  return (
    <main className="bg-[#FAF9F6] min-h-screen pb-20">
      {/* Hero */}
      <section
        className="relative h-[420px] bg-cover bg-center flex items-end"
        style={{
          backgroundImage:
            'linear-gradient(to top, rgba(0,0,0,0.8), rgba(0,0,0,0.1)), url(https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1600&q=80)',
        }}
      >
        <div className="max-w-6xl mx-auto w-full px-6 pb-10">
          <span className="inline-block bg-[#A3E635] text-[#111111] text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4">
            Valuation Status: Confirmed
          </span>
          <h1 className="font-heading text-5xl font-bold text-white leading-tight">{data.address}</h1>
          <p className="text-white/75 text-base mt-2 max-w-xl">{data.tagline}</p>
        </div>
      </section>

      {/* Valuation + market pulse */}
      <section className="max-w-6xl mx-auto px-6 -mt-10 relative z-10 grid lg:grid-cols-[1.4fr_1fr] gap-6">
        {/* Estimate card */}
        <div className="bg-white rounded-2xl border border-[#E8E6E1] p-8 shadow-sm">
          <div className="flex items-start justify-between mb-2">
            <p className="text-[11px] font-bold uppercase tracking-widest text-[#6B6B6B]">Estimated Market Value</p>
            <div className="text-right">
              <p className="text-[11px] font-bold uppercase tracking-widest text-[#1C3829]">Confidence Score</p>
              <p className="font-heading text-xl font-bold text-[#1C3829]">{data.confidenceScore}%</p>
            </div>
          </div>
          <p className="font-heading text-5xl font-bold text-[#1C3829] leading-tight my-3">
            {formatM(data.estimatedValueLow)} – {formatM(data.estimatedValueHigh)}
          </p>
          <p className="text-[#6B6B6B] text-sm mb-6">
            Report generated based on live neural market analysis as of today.
          </p>
          <div className="grid grid-cols-3 gap-4 border-t border-[#F2F0EB] pt-5">
            <Stat label="Price / Sq.Ft" value={data.pricePerSqFt} />
            <Stat label="Estimated Yield" value={data.estimatedYield} />
            <Stat label="Days on Market" value={data.daysOnMarket} />
          </div>
        </div>

        {/* Market pulse */}
        <div className="bg-[#1C2C1A] rounded-2xl p-7 text-white">
          <div className="flex items-center gap-2 mb-5">
            <TrendingUp size={18} className="text-[#A3E635]" />
            <p className="font-heading text-lg font-bold">AI Market Pulse</p>
          </div>
          <div className="space-y-5">
            {data.marketPulse.map((m) => (
              <div key={m.title}>
                <p className="text-sm font-semibold text-[#A3E635] mb-1">{m.title}</p>
                <p className="text-white/65 text-sm leading-relaxed">{m.body}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 pt-5 border-t border-white/10 flex items-start gap-2">
            <ShieldCheck size={16} className="text-[#A3E635] shrink-0 mt-0.5" />
            <p className="text-white/55 text-xs italic leading-relaxed">{data.strategyNote}</p>
          </div>
        </div>
      </section>

      {/* Comparables */}
      <section className="max-w-6xl mx-auto px-6 mt-14">
        <h2 className="font-heading text-2xl font-bold text-[#111111] mb-2">Comparative Market Analysis</h2>
        <p className="text-[#6B6B6B] text-sm mb-6">
          The most relevant recent sales used to validate this valuation.
        </p>
        <div className="grid sm:grid-cols-3 gap-5">
          {data.comparables.map((c) => (
            <article key={c.address} className="bg-white rounded-2xl border border-[#E8E6E1] overflow-hidden">
              <div className="bg-[#1C3829] text-white px-4 py-2 flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-widest">Sold</span>
                <span className="text-sm font-bold">{c.soldPrice}</span>
              </div>
              <div className="p-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#1C3829] mb-1">{c.soldDate}</p>
                <p className="font-heading text-base font-semibold text-[#111111] mb-2">{c.address}</p>
                <div className="flex items-center gap-3 text-xs text-[#6B6B6B] mb-3">
                  <span className="flex items-center gap-1"><Bed size={12} /> {c.beds}</span>
                  <span className="flex items-center gap-1"><Bath size={12} /> {c.baths}</span>
                  <span className="flex items-center gap-1"><Square size={12} /> {c.sqft.toLocaleString()} sqft</span>
                </div>
                <div className="flex items-center justify-between text-xs text-[#9B9B9B] border-t border-[#F2F0EB] pt-2">
                  <span>{c.distance}</span>
                  <span className="text-[#1C3829] font-medium">{c.comparability}</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-6 mt-14">
        <div className="bg-[#1C2C1A] rounded-2xl p-10 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="font-heading text-2xl font-bold text-white mb-2">Ready for a deeper perspective?</h3>
            <p className="text-white/60 text-sm max-w-md">
              Our local experts combine data with human intuition to refine your property’s potential. Schedule a private walkthrough today.
            </p>
          </div>
          <button className="flex items-center gap-2 bg-[#A3E635] text-[#111111] text-sm font-bold px-7 py-3.5 rounded-xl hover:bg-[#95D62F] transition-colors shrink-0">
            Schedule Walkthrough <ArrowRight size={16} />
          </button>
        </div>
      </section>
    </main>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-widest text-[#9B9B9B] mb-1">{label}</p>
      <p className="font-heading text-lg font-bold text-[#111111]">{value}</p>
    </div>
  )
}
