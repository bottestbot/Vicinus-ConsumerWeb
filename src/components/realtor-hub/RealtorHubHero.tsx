import Image from 'next/image'
import { Clock, MapPinned, Link2 } from 'lucide-react'

const PILLARS = [
  {
    icon: Clock,
    title: 'Claim Founding Member Package.',
  },
  {
    icon: MapPinned,
    title: 'Lock down your neighbourhood.',
  },
  {
    icon: Link2,
    title: 'A direct line to the founders.',
  },
]

export default function RealtorHubHero() {
  return (
    <section className="relative overflow-hidden bg-[#16241A]">
      <div className="relative mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-6 pb-16 pt-32 lg:grid-cols-2 lg:gap-16 lg:pb-24 lg:pt-40">
        {/* Left copy */}
        <div>
          <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#A3E635]">
            Founding Access
          </span>
          <h1 className="mt-4 font-heading text-4xl font-bold leading-[1.05] tracking-tight text-white sm:text-5xl">
            Be first through the door.
          </h1>
          <p className="mt-6 max-w-md text-base leading-relaxed text-white/70">
            Vicinus Pro launches soon across Greater Vancouver! We&rsquo;re offering our Founding
            Member Package to the first 200 realtors only. You&rsquo;ll get $1,000 in credits, 3
            months free on your neighbourhood spot, and a close partnership with our founding team.
            Only 5 spots per neighbourhood&mdash;lock yours in now!
          </p>
          <a
            href="#claim-access"
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-[#A3E635] px-6 py-3.5 text-sm font-bold text-[#111111] transition-colors hover:bg-[#95D62F]"
          >
            Claim Your Founding Access
          </a>
          <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.15em] text-white/40">
            112 neighbourhoods &middot; 5 spots each &middot; first claim, first served
          </p>
        </div>

        {/* Right image. The wrapper carries a dusk-toned gradient of its own so
            the hero still reads as a deliberate panel — not an empty box — while
            the photo loads, or if it fails to load entirely. */}
        <div
          className="relative aspect-[4/3] overflow-hidden rounded-2xl ring-1 ring-white/10 lg:aspect-[5/4]"
          style={{
            background:
              'linear-gradient(160deg, #2E4A54 0%, #1F3630 45%, #16241A 100%)',
          }}
        >
          <Image
            src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80"
            alt="Modern Vancouver-area home exterior at dusk"
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
        </div>
      </div>

      {/* Pillar strip */}
      <div className="relative mx-auto max-w-6xl px-6 pb-16 lg:pb-20">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {PILLARS.map((p) => (
            <div
              key={p.title}
              className="rounded-xl border border-white/10 bg-white/[0.04] p-5"
            >
              <p.icon size={18} className="text-[#A3E635]" />
              <p className="mt-3 text-sm font-semibold text-white">{p.title}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
