export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronRight, Bed, Bath, Square } from 'lucide-react'
import Navbar from '@/components/layout/Navbar'
import HeroSearchBar from '@/components/landing/HeroSearchBar'
import Footer from '@/components/layout/Footer'
import { getNeighbourhoods } from '@/lib/api/neighbourhoods'
import { getFeaturedProperties, type FeaturedProperty } from '@/lib/api/properties'
import { formatPrice } from '@/types/search'
import { geocodeCity, getNeighbourhoodMapImageUrl } from '@/lib/neighbourhood-images'

export const metadata: Metadata = {
  title: 'Vicinus | Luxury Canadian Real Estate',
  description:
    "Beyond data. The Vicinus standard — intelligent curation of Canada's finest properties.",
}

// Safe fallback image for a city card when no representative neighbourhood
// image is available (e.g. the neighbourhoods API returns []).
const CITY_FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=900&q=80'

// ── Sub-components ────────────────────────────────────────────────────────────

function PropertyCard({ p }: { p: FeaturedProperty }) {
  return (
    <Link href={p.href} className="group shrink-0 w-72 sm:w-auto">
      <article className="bg-white rounded-2xl overflow-hidden border border-[#E8E6E1] hover:shadow-lg transition-shadow">
        <div className="relative h-52 overflow-hidden bg-[#F2F0EB]">
          {p.image && (
            <Image
              src={p.image}
              alt={p.name}
              fill
              sizes="288px"
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
          )}
          <div className="absolute top-3 left-3">
            <span className="bg-[#1C3829] text-white text-[10px] font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider">
              {p.badge}
            </span>
          </div>
        </div>
        <div className="p-4">
          <div className="flex items-start justify-between gap-2 mb-1">
            <p className="font-heading text-base font-semibold text-[#111111] leading-tight truncate">
              {p.name}
            </p>
            {p.price != null && (
              <p className="font-semibold text-[#111111] text-sm shrink-0">
                {formatPrice(p.price)}
              </p>
            )}
          </div>
          <p className="text-[#6B6B6B] text-xs mb-3">{p.location}</p>
          <div className="flex items-center gap-3 text-xs text-[#6B6B6B]">
            <span className="flex items-center gap-1">
              <Bed size={12} /> {p.beds ?? '—'} Beds
            </span>
            <span className="flex items-center gap-1">
              <Bath size={12} /> {p.baths ?? '—'} Baths
            </span>
            <span className="flex items-center gap-1">
              <Square size={12} /> {p.sqft != null ? p.sqft.toLocaleString() : '—'} sqft
            </span>
          </div>
        </div>
      </article>
    </Link>
  )
}

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
              {c.neighbourhoodCount} {c.neighbourhoodCount === 1 ? 'Neighbourhood' : 'Neighbourhoods'}
            </span>
          </div>
        )}
      </article>
    </Link>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function LandingPage() {
  const [neighbourhoods, highlights] = await Promise.all([
    getNeighbourhoods(),
    getFeaturedProperties(),
  ])
  // "Contextual Living" cities (not neighbourhoods). Image + province sourced
  // from a representative neighbourhood in each city when available, else a safe
  // fallback; each card links to a city-scoped search.
  // TODO: replace with a proper curated selection later.
  const FEATURED_CITIES = ['Vancouver', 'Kelowna', 'West Vancouver', 'Whistler']
  const cities = await Promise.all(
    FEATURED_CITIES.map(async (name) => {
      const inCity = neighbourhoods.filter((n) => n.city?.toLowerCase() === name.toLowerCase())
      const match = inCity[0]
      const coords = await geocodeCity(name)
      return {
        name,
        province: match?.province ?? 'British Columbia',
        imageUrl: coords ? getNeighbourhoodMapImageUrl(coords.lat, coords.lng) : CITY_FALLBACK_IMAGE,
        href: `/search?q=${encodeURIComponent(name)}`,
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
          <h1 className="font-heading text-5xl sm:text-6xl lg:text-7xl font-bold text-white leading-tight tracking-tight max-w-4xl mx-auto mb-8">
            The Art of{' '}
            <span className="text-[#A3E635]">Intelligence</span>
            {' '}in Living.
          </h1>

          {/* Search bar */}
          <HeroSearchBar />
        </div>

        {/* Scroll hint */}
        <div className="relative z-10 flex justify-center pb-8">
          <div className="w-px h-12 bg-gradient-to-b from-white/0 to-white/40" />
        </div>
      </section>

      {/* ── Curated Highlights ────────────────────────────────────────────── */}
      {highlights.length > 0 && (
        <section className="pb-20 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-end justify-between mb-8">
              <div>
                <p className="text-[11px] font-semibold text-[#1C3829] uppercase tracking-widest mb-2">
                  Hand-picked
                </p>
                <h2 className="font-heading text-3xl font-bold text-[#111111]">
                  Curated Highlights
                </h2>
                <p className="text-[#6B6B6B] text-sm mt-1">
                  Active, intelligently-vetted opportunities.
                </p>
              </div>
              <Link
                href="/search"
                className="hidden sm:flex items-center gap-1 text-sm text-[#6B6B6B] hover:text-[#111111] transition-colors"
              >
                View all <ChevronRight size={14} />
              </Link>
            </div>

            <div className="flex sm:grid sm:grid-cols-3 gap-5 overflow-x-auto sm:overflow-visible pb-2 sm:pb-0 -mx-6 px-6 sm:mx-0 sm:px-0">
              {highlights.slice(0, 3).map((p) => (
                <PropertyCard key={p.id} p={p} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Contextual Living ─────────────────────────────────────────────── */}
      {cities.length > 0 && (
        <section className="pb-20 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="font-heading text-4xl font-bold text-[#111111] mb-3">
                Contextual Living
              </h2>
              <p className="text-[#6B6B6B] max-w-md mx-auto text-sm leading-relaxed">
                Luxury isn&apos;t just four walls. It&apos;s the street, the air, and the
                community. Explore our preferred cities.
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
                All Neighbourhoods <ChevronRight size={14} />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ── Expert CTA ────────────────────────────────────────────────────── */}
      <section className="py-24 px-6 bg-[#1C2C1A]">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-heading text-4xl lg:text-5xl font-bold text-white mb-4 leading-tight">
            Expertise for the Discerning Buyer.
          </h2>
          <p className="text-white/55 text-base leading-relaxed mb-10 max-w-lg mx-auto">
            Our agents aren&apos;t just salespeople. They are local curators and investment
            analysts who understand the nuances of architectural value.
          </p>
          <Link
            href="/sign-up"
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-[#A3E635] text-[#111111] text-sm font-bold rounded-xl hover:bg-[#95D62F] transition-colors"
          >
            Contact a Vicinus Advisor
          </Link>
        </div>
      </section>

      <Footer />
    </main>
  )
}
