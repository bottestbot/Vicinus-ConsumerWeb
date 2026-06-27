import type { Metadata } from 'next'
import SearchPageClient, { type InitialSearch } from './SearchPageClient'

export const metadata: Metadata = {
  title: 'Search Properties',
  description: 'Search luxury Canadian real estate listings — filter by city, price, bedrooms, and more.',
}

type SearchParams = Record<string, string | string[] | undefined>

const first = (v: string | string[] | undefined): string | undefined =>
  Array.isArray(v) ? v[0] : v

function toNum(v: string | string[] | undefined): number | null {
  const s = first(v)
  if (!s) return null
  const n = Number(s)
  return Number.isFinite(n) && n > 0 ? n : null
}

// Hero form submits `priceRange=min-max` (e.g. "1000000-2000000", "5000000-")
function parsePriceRange(v: string | undefined): { minPrice: number | null; maxPrice: number | null } {
  if (!v) return { minPrice: null, maxPrice: null }
  const [min, max] = v.split('-')
  const num = (s: string | undefined) => {
    const n = Number(s)
    return s && Number.isFinite(n) && n > 0 ? n : null
  }
  return { minPrice: num(min), maxPrice: num(max) }
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const sp = await searchParams
  const range = parsePriceRange(first(sp.priceRange))
  const type = first(sp.type)

  const initial: InitialSearch = {
    query: first(sp.q) ?? first(sp.city) ?? '',
    minPrice: toNum(sp.minPrice) ?? range.minPrice,
    maxPrice: toNum(sp.maxPrice) ?? range.maxPrice,
    beds: toNum(sp.beds),
    baths: toNum(sp.baths),
    propertyType: type ? type.split(',').map((t) => t.trim()).filter(Boolean) : [],
  }

  return <SearchPageClient initial={initial} />
}
