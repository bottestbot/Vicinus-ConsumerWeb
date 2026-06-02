import Image from 'next/image'
import type { Neighbourhood } from '@/types/neighbourhood'

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1548656848-c80e1d02d05a?w=1400&q=80'

interface Props {
  neighbourhood: Neighbourhood
}

export default function NeighbourhoodHero({ neighbourhood }: Props) {
  return (
    <div className="relative h-full min-h-[480px] w-full overflow-hidden rounded-2xl">
      <Image
        src={neighbourhood.imageUrl ?? FALLBACK_IMAGE}
        alt={neighbourhood.name}
        fill
        priority
        sizes="(max-width: 768px) 100vw, 65vw"
        className="object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/15 to-transparent" />
      <div className="absolute bottom-8 left-8">
        <h1 className="font-heading text-5xl lg:text-6xl font-bold text-white leading-tight drop-shadow-sm">
          {neighbourhood.name}.
        </h1>
        <p className="mt-1.5 text-white/75 text-base font-ui tracking-wide">
          {neighbourhood.city}, {neighbourhood.province}
        </p>
      </div>
    </div>
  )
}
