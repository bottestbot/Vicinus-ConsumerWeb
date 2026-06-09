import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { getNeighbourhoods } from '@/lib/api/neighbourhoods'
import { formatPrice } from '@/types/search'
import type { Neighbourhood } from '@/types/neighbourhood'

export const metadata: Metadata = {
  title: 'Vicinus | Luxury Canadian Real Estate',
  description: 'Beyond data. The Vicinus standard — intelligent curation of Canada\'s finest properties.',
}

const WHY_VICINUS = [
  {
    label: 'Curation',
    body: 'Every listing is hand-selected against the Vicinus standard — no noise, no compromises.',
  },
  {
    label: 'Intelligence',
    body: 'Deep neighbourhood data, market context, and mortgage analysis in one place.',
  },
  {
    label: 'Luxury',
    body: "Canada's most prestigious enclaves, presented with the discretion they deserve.",
  },
]

function NeighbourhoodCard({ n }: { n: Neighbourhood }) {
  return (
    <Link href={`/neighbourhoods/${n.slug}`} className="group shrink-0 w-64 sm:w-auto">
      <article className="relative rounded-2xl overflow-hidden h-72 bg-[#E8E6E1]">
        {n.imageUrl && (
          <Image
            src={n.imageUrl}
            alt={n.name}
            fill
            sizes="(max-width: 640px) 256px, 33vw"
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
        <div className="absolute bottom-0 left-0 p-5">
          <p className="font-heading text-xl font-bold text-white leading-tight">{n.name}</p>
          <p className="text-white/70 text-xs mt-0.5">{n.city}, {n.province}</p>
          {n.medianPrice && (
            <p className="text-white/90 text-sm font-semibold mt-1">
              {formatPrice(n.medianPrice)}
              <span className="text-white/50 font-normal text-xs ml-1">med.</span>
            </p>
          )}
        </div>
      </article>
    </Link>
  )
}

export default async function LandingPage() {
  const neighbourhoods = await getNeighbourhoods()
  const featured = neighbourhoods.slice(0, 6)

  return (
    <main className="bg-[#FAF9F6] min-h-screen text-[#111111]">
      <Navbar />

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="pt-32 pb-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-[11px] font-semibold text-[#1C3829] uppercase tracking-widest mb-5">
            The Intelligent Curator
          </p>
          <h1 className="font-heading text-5xl sm:text-6xl lg:text-7xl font-bold text-[#111111] leading-tight tracking-tight mb-6">
            The Art of Intelligence in Living
          </h1>
          <p className="text-[#6B6B6B] text-lg sm:text-xl max-w-2xl mx-auto mb-10">
            Beyond data. Canada&apos;s finest properties — curated for those who expect more.
          </p>

          {/* Search bar */}
          <form
            action="/search"
            method="GET"
            className="flex gap-2 max-w-xl mx-auto mb-8"
          >
            <input
              name="q"
              type="text"
              placeholder="Search by city, neighbourhood, or address…"
              className="flex-1 text-sm px-4 py-3 rounded-xl border border-[#E8E6E1] bg-white text-[#111111] placeholder-[#9B9B9B] focus:outline-none focus:ring-2 focus:ring-[#1C3829]/30 focus:border-[#1C3829] transition-all"
            />
            <button
              type="submit"
              className="px-5 py-3 bg-[#1C3829] text-white text-sm font-semibold rounded-xl hover:bg-[#2D5A3D] transition-colors shrink-0"
            >
              Search
            </button>
          </form>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/search"
              className="w-full sm:w-auto px-8 py-3 bg-[#1C3829] text-white text-sm font-semibold rounded-xl hover:bg-[#2D5A3D] transition-colors text-center"
            >
              Explore Properties
            </Link>
            <Link
              href="/sign-up"
              className="w-full sm:w-auto px-8 py-3 border border-[#1C3829] text-[#1C3829] text-sm font-semibold rounded-xl hover:bg-[#1C3829]/5 transition-colors text-center"
            >
              Create Free Account
            </Link>
          </div>
        </div>
      </section>

      {/* ── Featured Neighbourhoods ───────────────────────────────────────── */}
      {featured.length > 0 && (
        <section className="pb-20 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-end justify-between mb-8">
              <div>
                <p className="text-[11px] font-semibold text-[#1C3829] uppercase tracking-widest mb-2">
                  Curated by Vicinus
                </p>
                <h2 className="font-heading text-3xl font-bold text-[#111111]">
                  Neighbourhoods.
                </h2>
              </div>
              <Link
                href="/neighbourhoods"
                className="text-sm text-[#6B6B6B] hover:text-[#111111] transition-colors hidden sm:block"
              >
                View all →
              </Link>
            </div>

            {/* Horizontal scroll on mobile, grid on desktop */}
            <div className="flex sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-5 overflow-x-auto sm:overflow-visible pb-2 sm:pb-0 -mx-6 px-6 sm:mx-0 sm:px-0">
              {featured.map((n) => (
                <NeighbourhoodCard key={n.slug} n={n} />
              ))}
            </div>

            <Link
              href="/neighbourhoods"
              className="mt-5 text-sm text-[#6B6B6B] hover:text-[#111111] transition-colors sm:hidden block text-center"
            >
              View all neighbourhoods →
            </Link>
          </div>
        </section>
      )}

      {/* ── Why Vicinus ───────────────────────────────────────────────────── */}
      <section className="py-20 px-6 bg-[#1C3829]">
        <div className="max-w-5xl mx-auto text-center mb-14">
          <p className="text-white/50 text-[11px] font-semibold uppercase tracking-widest mb-3">
            Why Vicinus
          </p>
          <h2 className="font-heading text-4xl font-bold text-white">
            A different standard.
          </h2>
        </div>
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          {WHY_VICINUS.map((item) => (
            <div key={item.label} className="text-center">
              <h3 className="font-heading text-xl font-bold text-white mb-3">{item.label}</h3>
              <p className="text-white/60 text-sm leading-relaxed">{item.body}</p>
            </div>
          ))}
        </div>
        <div className="text-center mt-14">
          <Link
            href="/sign-up"
            className="inline-flex items-center px-8 py-3.5 bg-white text-[#1C3829] text-sm font-semibold rounded-xl hover:bg-[#FAF9F6] transition-colors"
          >
            Join Vicinus — It&apos;s Free
          </Link>
        </div>
      </section>

      <Footer />
    </main>
  )
}
