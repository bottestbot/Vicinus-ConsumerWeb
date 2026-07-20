// NBHD-10 — Cinematic hero. Full-bleed image with a bottom→top forest-green
// scrim, the neighbourhood name in Playfair, a city pill + flavour chips, and a
// lime "X% match for you" badge (top-right) when the visitor is personalized.
import Image from 'next/image'
import type { NeighbourhoodDetailResponse } from '@/types/neighbourhood-detail'

interface Props {
  neighbourhood: NeighbourhoodDetailResponse['neighbourhood']
  personalization: NeighbourhoodDetailResponse['personalization']
}

export default function NeighbourhoodHero({ neighbourhood, personalization }: Props) {
  const { name, city, heroImageUrl, flavors } = neighbourhood

  return (
    <section className="relative min-h-[60vh] w-full overflow-hidden rounded-2xl bg-[#1C3829]">
      {heroImageUrl && (
        <Image
          src={heroImageUrl}
          alt={`${name}, ${city}`}
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
      )}

      {/* Bottom→top forest-green scrim */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0F231A] via-[#1C3829]/55 to-transparent" />

      {/* Match badge (top-right) */}
      {personalization && (
        <div className="absolute right-4 top-4 sm:right-6 sm:top-6">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#A3E635] px-3.5 py-1.5 text-sm font-semibold text-[#1C3829] shadow-sm">
            {personalization.matchPercent}% match for you
          </span>
        </div>
      )}

      {/* Overlay content (bottom-left) */}
      <div className="absolute inset-x-0 bottom-0 p-5 sm:p-8">
        <span className="mb-3 inline-flex items-center rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-white ring-1 ring-white/20 backdrop-blur-sm">
          {city}
        </span>
        <h1 className="font-heading text-[48px] font-semibold leading-[1.05] text-white sm:text-[56px] lg:text-[64px]">
          {name}
        </h1>
        {flavors.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {flavors.map((flavor) => (
              <span
                key={flavor}
                className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white ring-1 ring-white/20 backdrop-blur-sm"
              >
                {flavor}
              </span>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

export function NeighbourhoodHeroSkeleton() {
  return (
    <div className="relative min-h-[60vh] w-full animate-pulse overflow-hidden rounded-2xl bg-[#E8E6E1]">
      <div className="absolute inset-x-0 bottom-0 p-5 sm:p-8">
        <div className="mb-3 h-6 w-24 rounded-full bg-white/40" />
        <div className="h-14 w-2/3 rounded bg-white/50" />
      </div>
    </div>
  )
}
