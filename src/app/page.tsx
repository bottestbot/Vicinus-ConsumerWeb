// SEO-06: this was `dynamic = 'force-dynamic'`, which rendered our single
// most-crawled URL from scratch on every request and disabled the data cache
// wholesale — the worst TTFB on the site, on the page Google samples most.
//
// Nothing here needs per-request freshness: the neighbourhood list declares
// `revalidate: 1800` on its own fetch and the city geocodes 86400, so 30
// minutes is the effective window. An hour at the route level is simply the
// ceiling.
//
// SEO-18(a): this page no longer renders DDF listing data at all (the featured
// strip was removed), so nothing CREA-licensed reaches the CDN-cached HTML.
// That is what makes caching this route safe — re-adding any listing content
// here would put it back into a cached, crawlable document. Don't.
//
// Route Segment Config still applies because `cacheComponents` is off in
// next.config.ts — under Cache Components this export is removed in v16.
// Refs: node_modules/next/dist/docs/01-app/02-guides/caching-without-cache-components.md
//       ("Route segment config `revalidate`") and
//       node_modules/next/dist/docs/01-app/02-guides/incremental-static-regeneration.md.
// Note the value must be statically analyzable — `3600`, not `60 * 60`.
export const revalidate = 3600

import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import Navbar from '@/components/layout/Navbar'
import HeroSearchBar from '@/components/landing/HeroSearchBar'
import GetInTouchButton from '@/components/landing/GetInTouchButton'
import Footer from '@/components/layout/Footer'
import { getNeighbourhoods } from '@/lib/api/neighbourhoods'
import { STRINGS } from '@/lib/strings'
import { geocodeCity, getNeighbourhoodMapImageUrl } from '@/lib/neighbourhood-images'

export const metadata: Metadata = {
  title: 'Vicinus | Canadian Real Estate & Predictive Insights',
  description:
    'Bringing you closer to home. Powered by predictive data and smart tech, our advisors help you discover premier Canadian properties and make informed moves',
  openGraph: {
    title: 'Vicinus | Canadian Real Estate & Smart Market Data',
    description:
      'Bringing you closer to home. Powered by predictive data, Vicinus helps you discover top Canadian properties and make smarter real estate decisions.',
  },
}

// Safe fallback image for a city card when no representative neighbourhood
// image is available (e.g. the neighbourhoods API returns []).
const CITY_FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=900&q=80'

// ── Sub-components ────────────────────────────────────────────────────────────

interface CityCardData {
  name: string
  province: string
  imageUrl: string
  href: string
  neighbourhoodCount: number
}

function CityCard({ c }: { c: CityCardData }) {
  return (
    <Link href={c.href} className="group">
      <article className="relative rounded-2xl overflow-hidden h-64 bg-[#E8E6E1]">
        {c.imageUrl && (
          <Image
            src={c.imageUrl}
            alt={c.name}
            fill
            sizes="(max-width: 640px) 100vw, 25vw"
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
        <div className="absolute bottom-0 left-0 p-5">
          <p className="font-heading text-xl font-bold text-white leading-tight">{c.name}</p>
          <p className="text-white/60 text-xs mt-0.5">{c.province}</p>
        </div>
        {c.neighbourhoodCount > 0 && (
          <div className="absolute top-3 left-3">
            <span className="bg-[#A3E635] text-[#111111] text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
              {c.neighbourhoodCount}{' '}
              {c.neighbourhoodCount === 1
                ? STRINGS.HOMEPAGE_CITIES_BADGE_SINGULAR
                : STRINGS.HOMEPAGE_CITIES_BADGE_PLURAL}
            </span>
          </div>
        )}
      </article>
    </Link>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function LandingPage() {
  const neighbourhoods = await getNeighbourhoods()
  // "Contextual Living" cities (not neighbourhoods). Image + province sourced
  // from a representative neighbourhood in each city when available, else a safe
  // fallback; each card links to a city-scoped search.
  // TODO: replace with a proper curated selection later.
  const FEATURED_CITIES = ['Vancouver', 'Burnaby', 'West Vancouver', 'North Vancouver']
  const cities = await Promise.all(
    FEATURED_CITIES.map(async (name) => {
      const inCity = neighbourhoods.filter((n) => n.city?.toLowerCase() === name.toLowerCase())
      const match = inCity[0]
      const coords = await geocodeCity(name)
      return {
        name,
        province: match?.province ?? 'British Columbia',
        imageUrl: coords ? getNeighbourhoodMapImageUrl(coords.lat, coords.lng) : CITY_FALLBACK_IMAGE,
        href: `/neighbourhoods?city=${encodeURIComponent(name)}`,
        neighbourhoodCount: inCity.length,
      }
    }),
  )

  return (
    <main className="bg-[#FAF9F6] text-[#111111]">
      <Navbar overHero />

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex flex-col">
        {/* Background image */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              'url(https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1920&q=80)',
          }}
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/40 to-black/65" />

        {/* Hero content */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 pt-24 pb-20 text-center">
          {/* SEO-06: the H1 now carries two lines. The brand line is unchanged
              and still the visual hero — same font, size, weight, accent and
              spacing as before, just moved onto an inner <span> so a second,
              keyword-bearing line can sit inside the same <h1>. That is what
              gives the heading "homes for sale", "rent" and "Canada" without
              rewriting the brand. */}
          <h1 className="max-w-4xl mx-auto mb-8">
            <span className="block font-heading text-5xl sm:text-6xl lg:text-7xl font-bold text-white leading-tight tracking-tight">
              {STRINGS.HOMEPAGE_HERO_TITLE_LEAD}{' '}
              <span className="text-[#A3E635]">{STRINGS.HOMEPAGE_HERO_TITLE_ACCENT}</span>
              {' '}{STRINGS.HOMEPAGE_HERO_TITLE_TRAIL}
            </span>
            <span className="block mt-4 text-base sm:text-lg font-normal text-white/70 leading-relaxed max-w-2xl mx-auto">
              {STRINGS.HOMEPAGE_HERO_TITLE_KEYWORD}
            </span>
          </h1>

          {/* Search bar */}
          <HeroSearchBar tone="on-dark" />
        </div>

        {/* Scroll hint */}
        <div className="relative z-10 flex justify-center pb-8">
          <div className="w-px h-12 bg-gradient-to-b from-white/0 to-white/40" />
        </div>
      </section>

      {/* ── Contextual Living ─────────────────────────────────────────────── */}
      {cities.length > 0 && (
        // SEO-18(a): `pt-16` moved here from the removed featured-listings
        // section, which used to supply the gap below the hero.
        <section className="pt-16 pb-20 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="font-heading text-4xl font-bold text-[#111111] mb-3">
                {STRINGS.HOMEPAGE_CITIES_TITLE}
              </h2>
              <p className="text-[#6B6B6B] max-w-md mx-auto text-sm leading-relaxed">
                {STRINGS.HOMEPAGE_CITIES_BODY}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {cities.map((c) => (
                <CityCard key={c.name} c={c} />
              ))}
            </div>

            <div className="text-center mt-8">
              <Link
                href="/neighbourhoods"
                className="inline-flex items-center gap-2 text-sm text-[#6B6B6B] hover:text-[#111111] transition-colors"
              >
                {STRINGS.HOMEPAGE_CITIES_ALLLINK} <ChevronRight size={14} />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ── Expert CTA ────────────────────────────────────────────────────── */}
      <section className="py-24 px-6 bg-[#1C2C1A]">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-heading text-4xl lg:text-5xl font-bold text-white mb-4 leading-tight">
            Real estate guidance from people who actually know the neighborhood.
          </h2>
          <p className="text-white/55 text-base leading-relaxed mb-10 max-w-lg mx-auto">
            No sales pitches or complicated jargon. Just honest advice, a deep knowledge of local
            homes, and someone in your corner from day one.
          </p>
          <GetInTouchButton />
        </div>
      </section>

      <Footer />
    </main>
  )
}
