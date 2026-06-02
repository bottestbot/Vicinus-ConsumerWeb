// Neighbourhoods index page — grid of all neighbourhood cards
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { getNeighbourhoods } from '@/lib/api/neighbourhoods'
import { formatPrice } from '@/types/search'
import type { Neighbourhood } from '@/types/neighbourhood'

export const metadata: Metadata = {
  title: 'Explore Neighbourhoods',
  description: 'Explore Canada\'s most prestigious neighbourhoods — curated for discerning buyers.',
}

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1548656848-c80e1d02d05a?w=800&q=80'

function NeighbourhoodCard({ neighbourhood }: { neighbourhood: Neighbourhood }) {
  return (
    <Link href={`/neighbourhoods/${neighbourhood.slug}`} className="group">
      <article className="bg-white rounded-2xl border border-[#E8E6E1] overflow-hidden hover:border-[#1C3829]/40 hover:shadow-lg transition-all duration-300">
        <div className="relative h-52 overflow-hidden bg-[#F2F0EB]">
          <Image
            src={neighbourhood.imageUrl ?? FALLBACK_IMAGE}
            alt={neighbourhood.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          <div className="absolute bottom-4 left-4">
            <p className="font-heading text-xl font-bold text-white leading-tight">
              {neighbourhood.name}
            </p>
          </div>
        </div>
        <div className="p-4 flex items-center justify-between">
          <p className="text-sm text-[#6B6B6B]">
            {neighbourhood.city},{' '}
            <span className="font-medium text-[#111111]">{neighbourhood.province}</span>
          </p>
          {neighbourhood.medianPrice && (
            <p className="text-sm font-semibold text-[#111111]">
              {formatPrice(neighbourhood.medianPrice)}
              <span className="text-[10px] text-[#6B6B6B] font-normal ml-0.5">med.</span>
            </p>
          )}
        </div>
      </article>
    </Link>
  )
}

export default async function NeighbourhoodsPage() {
  const neighbourhoods = await getNeighbourhoods()

  return (
    <div className="min-h-screen bg-[#FAF9F6] pt-16 pb-20 font-ui">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-10">
        {/* Header */}
        <div className="mb-10">
          <p className="text-[11px] font-semibold text-[#1C3829] uppercase tracking-widest mb-2">
            Curated by Vicinus
          </p>
          <h1 className="font-heading text-4xl lg:text-5xl font-bold text-[#111111]">
            Neighbourhoods.
          </h1>
          <p className="mt-3 text-[#6B6B6B] max-w-xl">
            Canada's most prestigious enclaves — hand-selected for discerning buyers who expect more.
          </p>
        </div>

        {/* Grid */}
        {neighbourhoods.length === 0 ? (
          <div className="py-24 text-center">
            <div className="w-12 h-12 rounded-full bg-[#F2F0EB] flex items-center justify-center mx-auto mb-4">
              <span className="text-xl">🏘</span>
            </div>
            <p className="font-heading text-lg font-semibold text-[#111111] mb-1">No neighbourhoods available yet</p>
            <p className="text-sm text-[#6B6B6B] max-w-xs mx-auto">
              We're curating Canada's finest enclaves — check back soon.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {neighbourhoods.map((n) => (
              <NeighbourhoodCard key={n.slug} neighbourhood={n} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
