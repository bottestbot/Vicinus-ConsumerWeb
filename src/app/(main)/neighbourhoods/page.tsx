// Neighbourhoods index page
import type { Metadata } from 'next'
import { getNeighbourhoods } from '@/lib/api/neighbourhoods'
import NeighbourhoodsClient from '@/components/neighbourhood/NeighbourhoodsClient'

export const metadata: Metadata = {
  title: 'Explore Neighbourhoods',
  description: "Explore Canada's most prestigious neighbourhoods — curated for discerning buyers.",
}

export default async function NeighbourhoodsPage() {
  const neighbourhoods = await getNeighbourhoods()

  return (
    <div className="min-h-screen bg-[#FAF9F6] pt-16 pb-20 font-ui">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-10">
        {/* Header */}
        <div className="mb-8">
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

        {/* Dynamic filters + featured + grid — all client-side */}
        <NeighbourhoodsClient all={neighbourhoods} />
      </div>
    </div>
  )
}
