'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'
import { getSavedSearches } from '@/lib/api/search'

interface SavedSearch {
  id: string
  name: string | null
  filters: Record<string, unknown>
  createdAt: string
}

function buildSearchUrl(filters: Record<string, unknown>): string {
  const params = new URLSearchParams()
  if (filters.city) params.set('city', String(filters.city))
  if (filters.province) params.set('province', String(filters.province))
  if (filters.q) params.set('q', String(filters.q))
  if (filters.minPrice) params.set('minPrice', String(filters.minPrice))
  if (filters.maxPrice) params.set('maxPrice', String(filters.maxPrice))
  if (filters.beds) params.set('beds', String(filters.beds))
  if (filters.propertyType) params.set('propertyType', String(filters.propertyType))
  if (filters.listingType) params.set('listingType', String(filters.listingType))
  return `/search?${params.toString()}`
}

function searchLabel(s: SavedSearch): string {
  if (s.name) return s.name
  const f = s.filters
  const parts: string[] = []
  if (f.q) parts.push(String(f.q))
  if (f.city) parts.push(String(f.city))
  if (f.propertyType) parts.push(String(f.propertyType))
  return parts.join(' · ') || 'Unnamed Search'
}

export default function RecentSearches() {
  const router = useRouter()
  const [searches, setSearches] = useState<SavedSearch[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getSavedSearches()
      .then((res) => {
        const data = Array.isArray(res.data) ? res.data : []
        setSearches(data.slice(0, 6))
      })
      .catch(() => setSearches([]))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="mt-5">
        <p className="text-[11px] font-semibold text-[#6B6B6B] uppercase tracking-widest mb-3">
          Recent Searches
        </p>
        <div className="flex gap-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-9 w-36 rounded-full bg-[#E8E6E1] animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (searches.length === 0) {
    return (
      <div className="mt-5">
        <p className="text-[11px] font-semibold text-[#6B6B6B] uppercase tracking-widest mb-3">
          Recent Searches
        </p>
        <p className="text-sm text-[#6B6B6B]">
          No saved searches yet —{' '}
          <button
            onClick={() => router.push('/search')}
            className="font-semibold text-[#1C3829] hover:underline"
          >
            start exploring
          </button>
          .
        </p>
      </div>
    )
  }

  return (
    <div className="mt-5">
      <p className="text-[11px] font-semibold text-[#6B6B6B] uppercase tracking-widest mb-3">
        Recent Searches
      </p>
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {searches.map((s) => (
          <button
            key={s.id}
            onClick={() => router.push(buildSearchUrl(s.filters))}
            className="shrink-0 flex items-center gap-2 px-3.5 py-2 rounded-full border border-[#E8E6E1] bg-white text-sm text-[#111111] hover:border-[#1C3829]/40 hover:bg-[#F2F0EB] transition-colors whitespace-nowrap"
          >
            <Search size={12} className="text-[#6B6B6B]" />
            <span className="font-medium text-[13px]">{searchLabel(s)}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
