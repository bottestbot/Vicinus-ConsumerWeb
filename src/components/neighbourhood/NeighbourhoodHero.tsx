// NBHD-D01/D02/D03 — Split hero card. Left: photo panel with a city·province pill
// and the neighbourhood name on a dark scrim. Right: white panel with the market
// snapshot (median + trend, walk, transit, days on market) and a neighbourhood
// reel card. Panels stack on mobile.
import Image from 'next/image'
import MarketSnapshot from './MarketSnapshot'
import type { NeighbourhoodDetailResponse } from '@/types/neighbourhood-detail'

interface Props {
  neighbourhood: NeighbourhoodDetailResponse['neighbourhood']
  marketSnapshot: NeighbourhoodDetailResponse['marketSnapshot']
  walkScore: number | null
  transitScore: number | null
  province?: string
}

export default function NeighbourhoodHero({
  neighbourhood,
  marketSnapshot,
  walkScore,
  transitScore,
  province,
}: Props) {
  const { name, city, heroImageUrl } = neighbourhood
  const locationLabel = [city, province].filter(Boolean).join(' · ')

  return (
    <section className="grid overflow-hidden rounded-2xl border border-[#E8E6E1] bg-white md:grid-cols-2">
      {/* Left — photo panel */}
      <div className="relative min-h-[280px] md:min-h-[360px]">
        {heroImageUrl ? (
          <Image
            src={heroImageUrl}
            alt={`${name}, ${city}`}
            fill
            priority
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-[#1C3829]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0F231A] via-[#1C3829]/40 to-transparent" />
        {locationLabel && (
          <span className="absolute left-5 top-5 inline-flex items-center rounded-md bg-[#A3E635] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-widest text-[#1C3829]">
            {locationLabel}
          </span>
        )}
        <h1 className="absolute bottom-5 left-5 font-heading text-4xl font-semibold text-white sm:text-5xl">
          {name}.
        </h1>
      </div>

      {/* Right — market snapshot + reel */}
      <div className="flex flex-col gap-5 p-6 sm:p-7">
        <MarketSnapshot marketSnapshot={marketSnapshot} walkScore={walkScore} transitScore={transitScore} />
        <ReelCard />
      </div>
    </section>
  )
}

function ReelCard() {
  return (
    <div className="mt-auto flex items-center gap-3 rounded-xl bg-[#1C3829] p-3.5">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#A3E635]">
        {/* play triangle */}
        <svg width="14" height="14" viewBox="0 0 12 12" aria-hidden="true">
          <path d="M2 1.5v9l8-4.5-8-4.5z" fill="#1C3829" />
        </svg>
      </span>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-white">Neighbourhood reel</p>
        <p className="text-[11px] uppercase tracking-widest text-white/60">A 2-minute cinematic tour</p>
      </div>
    </div>
  )
}

export function NeighbourhoodHeroSkeleton() {
  return (
    <div className="grid overflow-hidden rounded-2xl border border-[#E8E6E1] bg-white md:grid-cols-2">
      <div className="min-h-[280px] animate-pulse bg-[#E8E6E1] md:min-h-[360px]" />
      <div className="flex flex-col gap-4 p-6 sm:p-7">
        <div className="h-4 w-32 animate-pulse rounded bg-[#E8E6E1]" />
        <div className="grid grid-cols-2 gap-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-12 animate-pulse rounded bg-[#F2F0EB]" />
          ))}
        </div>
        <div className="h-16 animate-pulse rounded-xl bg-[#E8E6E1]" />
      </div>
    </div>
  )
}
