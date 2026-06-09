import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { Search, MapPin, ChevronRight, Bed, Bath, Square } from 'lucide-react'
import HomeNavbar from '@/components/landing/HomeNavbar'
import Footer from '@/components/layout/Footer'
import { getNeighbourhoods } from '@/lib/api/neighbourhoods'
import { formatPrice } from '@/types/search'
import type { Neighbourhood } from '@/types/neighbourhood'

export const metadata: Metadata = {
  title: 'Vicinus | Luxury Canadian Real Estate',
  description:
    "Beyond data. The Vicinus standard — intelligent curation of Canada's finest properties.",
}

// ── Mock curated highlights ───────────────────────────────────────────────────
const CURATED_HIGHLIGHTS = [
  {
    id: '1',
    badge: 'New Editorial',
    name: 'The Solarium House',
    location: 'Palm Springs, CA',
    price: 4_250_000,
    beds: 4,
    baths: 5,
    sqft: 4_800,
    image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&q=80',
    href: '/search',
  },
  {
    id: '2',
    badge: 'New Editorial',
    name: 'Misty Ridge Estate',
    location: 'Aspen, CO',
    price: 8_900_000,
    beds: 6,
    baths: 8,
    sqft: 7_200,
    image: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=600&q=80',
    href: '/search',
  },
  {
    id: '3',
    badge: 'New Editorial',
    name: 'Vertical Garden Loft',
    location: 'Chelsea, NY',
    price: 5_150_000,
    beds: 3,
    baths: 3,
    sqft: 3_100,
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&q=80',
    href: '/search',
  },
]

// ── Sub-components ────────────────────────────────────────────────────────────

function PropertyCard({ p }: { p: (typeof CURATED_HIGHLIGHTS)[0] }) {
  return (
    <Link href={p.href} className="group shrink-0 w-72 sm:w-auto">
      <article className="bg-white rounded-2xl overflow-hidden border border-[#E8E6E1] hover:shadow-lg transition-shadow">
        <div className="relative h-52 overflow-hidden bg-[#F2F0EB]">
          <Image
            src={p.image}
            alt={p.name}
            fill
            sizes="288px"
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute top-3 left-3">
            <span className="bg-[#1C3829] text-white text-[10px] font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider">
              {p.badge}
            </span>
          </div>
        </div>
        <div className="p-4">
          <div className="flex items-start justify-between gap-2 mb-1">
            <p className="font-heading text-base font-semibold text-[#111111] leading-tight">
              {p.name}
            </p>
            <p className="font-semibold text-[#111111] text-sm shrink-0">
              {formatPrice(p.price)}
            </p>
          </div>
          <p className="text-[#6B6B6B] text-xs mb-3">{p.location}</p>
          <div className="flex items-center gap-3 text-xs text-[#6B6B6B]">
            <span className="flex items-center gap-1">
              <Bed size={12} /> {p.beds} Beds
            </span>
            <span className="flex items-center gap-1">
              <Bath size={12} /> {p.baths} Baths
            </span>
            <span className="flex items-center gap-1">
              <Square size={12} /> {p.sqft.toLocaleString()} sqft
            </span>
          </div>
        </div>
      </article>
    </Link>
  )
}

function NeighbourhoodCard({ n }: { n: Neighbourhood }) {
  return (
    <Link href={`/neighbourhoods/${n.slug}`} className="group">
      <article className="relative rounded-2xl overflow-hidden h-64 bg-[#E8E6E1]">
        {n.imageUrl && (
          <Image
            src={n.imageUrl}
            alt={n.name}
            fill
            sizes="(max-width: 640px) 100vw, 33vw"
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
        <div className="absolute bottom-0 left-0 p-5">
          <p className="font-heading text-xl font-bold text-white leading-tight">{n.name}</p>
          <p className="text-white/60 text-xs mt-0.5">
            {n.city}, {n.province}
          </p>
          {n.medianPrice && (
            <p className="text-white/80 text-sm font-semibold mt-1">
              {formatPrice(n.medianPrice)}
              <span className="text-white/40 font-normal text-xs ml-1">med.</span>
            </p>
          )}
        </div>
        <div className="absolute top-3 left-3">
          <span className="bg-[#A3E635] text-[#111111] text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
            {Math.floor(Math.random() * 20) + 8} Active Editorials
          </span>
        </div>
      </article>
    </Link>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function LandingPage() {
  const neighbourhoods = await getNeighbourhoods()
  const featured = neighbourhoods.slice(0, 3)

  return (
    <main className="bg-[#FAF9F6] text-[#111111]">
      <HomeNavbar />

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
          <form
            action="/search"
            method="GET"
            className="flex flex-col sm:flex-row gap-2 w-full max-w-2xl mx-auto"
          >
            <div className="flex-1 flex items-center gap-2 bg-white/95 backdrop-blur-sm rounded-xl px-4 py-3">
              <MapPin size={16} className="text-[#9B9B9B] shrink-0" />
              <input
                name="q"
                type="text"
                placeholder="Neighbourhood, City, or ZIP"
                className="flex-1 text-sm text-[#111111] placeholder-[#9B9B9B] bg-transparent focus:outline-none"
              />
            </div>
            <select
              name="priceRange"
              className="sm:w-40 px-4 py-3 bg-white/95 backdrop-blur-sm rounded-xl text-sm text-[#6B6B6B] focus:outline-none cursor-pointer"
              defaultValue=""
            >
              <option value="">Price Range</option>
              <option value="0-1000000">Under $1M</option>
              <option value="1000000-2000000">$1M – $2M</option>
              <option value="2000000-5000000">$2M – $5M</option>
              <option value="5000000-">$5M+</option>
            </select>
            <button
              type="submit"
              className="flex items-center justify-center gap-2 px-6 py-3 bg-[#1C3829] text-white text-sm font-semibold rounded-xl hover:bg-[#2D5A3D] transition-colors shrink-0"
            >
              <Search size={16} />
              Discover
            </button>
          </form>
        </div>

        {/* Scroll hint */}
        <div className="relative z-10 flex justify-center pb-8">
          <div className="w-px h-12 bg-gradient-to-b from-white/0 to-white/40" />
        </div>
      </section>

      {/* ── Editorial section ─────────────────────────────────────────────── */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left image */}
          <div className="relative rounded-2xl overflow-hidden h-96 bg-[#1C3829]">
            <Image
              src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=900&q=80"
              alt="Curated Living"
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover opacity-80"
            />
            {/* Overlay card */}
            <div className="absolute bottom-6 left-6 bg-[#1C3829]/90 backdrop-blur-sm rounded-xl p-4 max-w-[200px]">
              <p className="text-[#A3E635] text-3xl font-heading font-bold mb-1">01</p>
              <p className="text-white/70 text-xs leading-snug">
                Every listing is hand-vetted by our editorial team for architectural integrity and location prestige.
              </p>
            </div>
          </div>

          {/* Right copy */}
          <div>
            <span className="inline-block text-[10px] font-semibold uppercase tracking-widest text-[#1C3829] border border-[#1C3829]/30 rounded-full px-3 py-1 mb-6">
              The Editorial Focus
            </span>
            <h2 className="font-heading text-4xl lg:text-5xl font-bold text-[#111111] leading-tight mb-5">
              Beyond Data.{' '}
              <br />
              The Vicinus Standard.
            </h2>
            <p className="text-[#6B6B6B] text-base leading-relaxed mb-8">
              Traditional portals prioritise volume. We prioritise vision. Vicinus Editorial is a
              curated collection of properties that define modern luxury, from mid-century
              restorations to sustainable avant-garde estates.
            </p>
            <Link
              href="/search"
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#1C3829] hover:gap-3 transition-all"
            >
              Explore the Collection
              <ChevronRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Curated Highlights ────────────────────────────────────────────── */}
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
            {CURATED_HIGHLIGHTS.map((p) => (
              <PropertyCard key={p.id} p={p} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Contextual Living ─────────────────────────────────────────────── */}
      {featured.length > 0 && (
        <section className="pb-20 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="font-heading text-4xl font-bold text-[#111111] mb-3">
                Contextual Living
              </h2>
              <p className="text-[#6B6B6B] max-w-md mx-auto text-sm leading-relaxed">
                Luxury isn&apos;t just four walls. It&apos;s the street, the air, and the
                community. Explore our preferred enclaves.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {featured.map((n) => (
                <NeighbourhoodCard key={n.slug} n={n} />
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
