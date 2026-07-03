import { ArrowRight, TrendingUp } from 'lucide-react'

// Lightweight, self-contained "intelligence dashboard" preview — no external
// screenshot asset. Reads as the product the copy is describing.
function ProductPreview() {
  return (
    <div className="relative">
      {/* Floating predictive-heat badge */}
      <div className="absolute -bottom-4 -left-4 z-20 rounded-xl bg-[#1C3829] px-4 py-3 shadow-xl ring-1 ring-white/10">
        <p className="text-[9px] font-semibold uppercase tracking-widest text-[#A3E635]">
          Predictive Heat
        </p>
        <p className="mt-0.5 flex items-center gap-1 text-sm font-bold text-white">
          <TrendingUp size={14} className="text-[#A3E635]" /> +24% Intent
        </p>
      </div>

      {/* Browser chrome */}
      <div className="overflow-hidden rounded-xl bg-white shadow-2xl ring-1 ring-black/5">
        <div className="flex items-center gap-1.5 border-b border-[#E8E6E1] bg-[#F2F0EB] px-4 py-2.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[#E36A5B]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#E8B84B]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#7FBF7F]" />
          <span className="ml-3 h-4 flex-1 rounded bg-white/70" />
        </div>

        <div className="p-4">
          <p className="text-[11px] text-[#6B6B6B]">Welcome back, Sarah</p>
          <p className="mb-3 text-[13px] font-semibold text-[#111111]">
            Here&apos;s your market pulse for Q2
          </p>

          {/* Stat tiles */}
          <div className="mb-3 grid grid-cols-3 gap-2">
            {[
              { label: 'Market Intensity', value: '6.4%' },
              { label: 'Median List Price', value: '$1.2M' },
              { label: 'Days / Listing', value: '84' },
            ].map((s) => (
              <div key={s.label} className="rounded-lg border border-[#E8E6E1] bg-[#FAF9F6] p-2.5">
                <p className="text-[8px] uppercase tracking-wide text-[#6B6B6B]">{s.label}</p>
                <p className="mt-0.5 text-sm font-bold text-[#111111]">{s.value}</p>
              </div>
            ))}
          </div>

          {/* Faux heatmap */}
          <div className="rounded-lg border border-[#E8E6E1] bg-[#1C2C1A] p-3">
            <p className="mb-2 text-[9px] font-semibold uppercase tracking-widest text-[#A3E635]/80">
              Neighbourhood Health
            </p>
            <div className="grid grid-cols-8 gap-1">
              {[
                40, 65, 90, 55, 30, 70, 85, 45, 60, 95, 50, 35, 80, 25, 75, 55,
                85, 45, 70, 90, 40, 60, 30, 65,
              ].map((v, i) => (
                <span
                  key={i}
                  className="h-4 rounded-sm"
                  style={{ backgroundColor: `rgba(163,230,53,${0.15 + (v / 100) * 0.85})` }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function RealtorHubHero() {
  return (
    <section className="relative overflow-hidden bg-[#1C3829]">
      {/* Subtle radial glow */}
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background:
            'radial-gradient(60% 60% at 80% 20%, rgba(163,230,53,0.12) 0%, rgba(28,56,41,0) 70%)',
        }}
      />
      <div className="relative mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-6 pb-20 pt-32 lg:grid-cols-2 lg:pb-28 lg:pt-36">
        {/* Left copy */}
        <div>
          <span className="inline-block rounded-full border border-[#A3E635]/40 px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-[#A3E635]">
            Coming Soon · Early Access
          </span>
          <h1 className="mt-6 font-heading text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
            Vicinus is coming for real estate professionals.
          </h1>
          <p className="mt-6 max-w-md text-base leading-relaxed text-white/70">
            Consumer portals haven&apos;t evolved in a decade. Vicinus is the new intelligence
            layer built to give modern Realtors a distinct edge — before your competitors get
            there first.
          </p>
          <a
            href="#waitlist"
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-[#A3E635] px-6 py-3.5 text-sm font-bold text-[#111111] transition-colors hover:bg-[#95D62F]"
          >
            Get Early Access <ArrowRight size={16} />
          </a>
        </div>

        {/* Right preview */}
        <div className="lg:pl-6">
          <ProductPreview />
        </div>
      </div>
    </section>
  )
}
