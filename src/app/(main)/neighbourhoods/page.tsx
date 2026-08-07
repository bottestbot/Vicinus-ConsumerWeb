// Neighbourhoods index page
//
// SEO-02: the default card grid is rendered HERE, in the server component, so the
// raw HTML carries a real `<a href="/neighbourhoods/{slug}">` for every
// neighbourhood. It is the only crawl path to the detail pages (there is no
// sitemap yet — SEO-01), and crawlers that execute no JavaScript were previously
// served nav + footer and nothing else. NeighbourhoodsClient layers search and the
// province/city filters on top and only takes over the grid once one is used.
import type { Metadata } from 'next'
import type { Neighbourhood } from '@/types/neighbourhood'
import Link from 'next/link'
import { Sparkles, ArrowRight } from 'lucide-react'
import { getNeighbourhoods } from '@/lib/api/neighbourhoods'
import NeighbourhoodsClient from '@/components/neighbourhood/NeighbourhoodsClient'
import NeighbourhoodGrid, {
  ALL_CITIES,
  browsableNeighbourhoods,
  defaultProvince,
  filterNeighbourhoods,
} from '@/components/neighbourhood/NeighbourhoodGrid'

export const metadata: Metadata = {
  title: 'Explore Neighbourhoods',
  description: "Explore Canada's most prestigious neighbourhoods — curated for discerning buyers.",
}

/**
 * SEO-18(b) — strip `medianPrice` before any of this reaches the client tree.
 *
 * ⚠️ Removing the price from the *card* is not enough, and this is the trap:
 * every row is handed to `<NeighbourhoodsClient>` as a prop, and props to a
 * Client Component serialize into the RSC flight payload, which ships inside
 * the HTML. So the value stayed in the served document (122 occurrences)
 * despite nothing rendering it. It has to be dropped from the *data*, here, at
 * the one boundary where the server hands rows to the client.
 *
 * `medianPrice` is backfilled from live DDF prices, and SEO-05 confirmed
 * derived aggregates count as DDF data — so it must not appear in
 * server-rendered, crawlable HTML.
 *
 * Verify with: `grep -c medianPrice .next/server/app/neighbourhoods.html` → 0.
 */
function stripDdfFields(rows: Neighbourhood[]): Neighbourhood[] {
  return rows.map((row) => {
    const copy = { ...row }
    delete copy.medianPrice
    return copy
  })
}

export default async function NeighbourhoodsPage() {
  const neighbourhoods = stripDdfFields(await getNeighbourhoods())

  // Must match NeighbourhoodsClient's initial state exactly — it renders this tree
  // verbatim until a filter or search is applied, so any divergence would show up
  // as a hydration mismatch. Both sides derive it from the same helpers.
  const browsable = browsableNeighbourhoods(neighbourhoods)
  const initialGrid = filterNeighbourhoods(browsable, defaultProvince(browsable), ALL_CITIES)

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

        {/* Filters + search are client-side; the default grid below is server-rendered */}
        <NeighbourhoodsClient all={neighbourhoods}>
          <NeighbourhoodGrid neighbourhoods={initialGrid} showCityTag />
        </NeighbourhoodsClient>
      </div>
    </div>
  )
}
