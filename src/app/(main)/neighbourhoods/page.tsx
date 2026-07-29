// Neighbourhoods index page
import type { Metadata } from 'next'
import Link from 'next/link'
import { Sparkles, ArrowRight } from 'lucide-react'
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
        <div className="mb-8 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <p className="text-[11px] font-semibold text-[#1C3829] uppercase tracking-widest mb-2">
              Explore Local Living
            </p>
            <h1 className="font-heading text-4xl lg:text-5xl font-bold text-[#111111]">
              Neighbourhoods.
            </h1>
            <p className="mt-3 text-[#6B6B6B] max-w-xl">
              From vibrant urban hubs to quiet coastal retreats — explore Canada&apos;s finest places to call home.
            </p>
          </div>

          <Link
            href="/vibe"
            className="group inline-flex shrink-0 items-center gap-3 self-start rounded-full bg-[#1C3829] py-3 pl-4 pr-5 text-white transition-colors hover:bg-[#16301F] lg:self-center"
          >
            <Sparkles size={16} className="shrink-0 text-[#A3E635]" aria-hidden="true" />
            <span className="min-w-0">
              <span className="block whitespace-nowrap text-sm font-bold leading-tight">
                Find your neighbourhood vibe
              </span>
              <span className="block whitespace-nowrap text-xs leading-tight text-white/60">2-minute quiz</span>
            </span>
            <span className="h-8 w-px shrink-0 bg-white/20" aria-hidden="true" />
            <span className="flex items-center gap-1 whitespace-nowrap text-sm font-semibold">
              Start
              <ArrowRight
                size={14}
                className="transition-transform group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </span>
          </Link>
        </div>

        {/* Dynamic filters + featured + grid — all client-side */}
        <NeighbourhoodsClient all={neighbourhoods} />
      </div>
    </div>
  )
}
