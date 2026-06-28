'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { Loader2, Maximize2, Smartphone } from 'lucide-react'
import FeedCard from '@/components/feed/FeedCard'
import FeedFilterBar, { type FeedFilters } from '@/components/feed/FeedFilterBar'
import { searchProperties } from '@/lib/api/search'
import type { Property } from '@/types/search'
import { useSearchStore } from '@/store/searchStore'

const PAGE_SIZE = 10

interface RawListing {
  id?: string
  ddfListingKey?: string
  address?: string | null
  city?: string | null
  province?: string | null
  postalCode?: string | null
  price?: number | null
  beds?: number | null
  baths?: number | null
  sqft?: number | null
  propertySubType?: string | null
  status?: string | null
  lat?: number | null
  lng?: number | null
  images?: { url?: string; isPrimary?: boolean; order?: number }[] | string[]
  imageUrl?: string | null
  description?: string | null
  agent?: { fullName?: string } | null
  office?: { name?: string } | null
  ddfListingId?: string | null
  virtualTourUrl?: string | null
  youtubeUrl?: string | null
  leaseAmount?: number | null
}

function mapListing(l: RawListing): Property {
  const images = Array.isArray(l.images)
    ? (l.images as Array<{ url?: string } | string>)
        .map((m) => (typeof m === 'string' ? m : (m.url ?? '')))
        // filter out matterport / non-image URLs (keep only http image CDN links with image extensions)
        .filter((u) => u && /\.(jpe?g|png|webp|gif)(\?.*)?$/i.test(u))
    : []

  const allowedStatus = ['Active', 'Sold', 'Coming Soon', 'Open House'] as const
  const rawStatus = l.status ?? 'Active'
  const status = (allowedStatus.includes(rawStatus as never) ? rawStatus : 'Active') as Property['status']

  return {
    id: String(l.id ?? l.ddfListingKey ?? ''),
    address: l.address ?? '',
    city: l.city ?? '',
    province: l.province ?? '',
    postalCode: l.postalCode ?? '',
    price: l.price ?? 0,
    beds: l.beds ?? 0,
    baths: l.baths ?? 0,
    sqft: l.sqft ?? 0,
    propertyType: l.propertySubType ?? '',
    status,
    daysOnMarket: 0,
    listingType: l.leaseAmount != null ? 'For Rent' : 'For Sale',
    latitude: l.lat ?? 0,
    longitude: l.lng ?? 0,
    imageUrl: images[0] ?? '',
    images,
    agentName: l.agent?.fullName ?? '',
    agentTitle: 'REALTOR®',
    brokerageName: l.office?.name ?? '',
    mlsNumber: l.ddfListingId ?? String(l.id ?? ''),
    description: l.description ?? undefined,
    virtualTourUrl: l.virtualTourUrl ?? null,
    youtubeUrl: l.youtubeUrl ?? null,
  }
}

const DEFAULT_FILTERS: FeedFilters = {
  q: '',
  city: '',
  listingType: '',
  maxPrice: null,
  beds: null,
  propertyType: '',
}

export default function FeedPage() {
  const { query: storeQuery, setQuery: setStoreQuery } = useSearchStore()
  const [filters, setFilters] = useState<FeedFilters>({
    ...DEFAULT_FILTERS,
    city: storeQuery,
    q: storeQuery,
  })
  const [viewMode, setViewMode] = useState<'full' | 'portrait'>('full')
  const [listings, setListings] = useState<Property[]>([])
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [activeIndex, setActiveIndex] = useState(0)

  const containerRef = useRef<HTMLDivElement>(null)
  const cardRefs = useRef<(HTMLDivElement | null)[]>([])
  const loadingRef = useRef(false)

  const load = useCallback(async (pageNum: number, f: FeedFilters, reset = false) => {
    if (loadingRef.current) return
    loadingRef.current = true
    setLoading(true)
    try {
      const params: Record<string, unknown> = {
        status: 'Active',
        page: pageNum,
        limit: PAGE_SIZE,
      }
      if (f.city) params.city = f.city
      if (f.q && !f.city) params.q = f.q
      if (f.listingType) params.listingType = f.listingType
      if (f.maxPrice) params.maxPrice = f.maxPrice
      if (f.beds) params.beds = f.beds
      if (f.propertyType) params.propertyType = f.propertyType

      const res = await searchProperties(params as Parameters<typeof searchProperties>[0])

      // API returns { data: [...], total, page, limit, totalPages }
      const body = res.data as { data?: RawListing[]; total?: number } | RawListing[]
      const raw: RawListing[] = Array.isArray(body)
        ? body
        : Array.isArray((body as { data?: RawListing[] }).data)
        ? (body as { data: RawListing[] }).data
        : []

      const mapped = raw
        .map(mapListing)
        .filter((p) => p.images.length > 0 || p.virtualTourUrl || p.youtubeUrl)
        .sort((a, b) => {
          const aVideo = a.youtubeUrl || a.virtualTourUrl ? 1 : 0
          const bVideo = b.youtubeUrl || b.virtualTourUrl ? 1 : 0
          return bVideo - aVideo
        })

      setListings((prev) => (reset ? mapped : [...prev, ...mapped]))
      setHasMore(raw.length === PAGE_SIZE)
    } catch {
      setHasMore(false)
    } finally {
      setLoading(false)
      loadingRef.current = false
    }
  }, [])

  // Initial load
  useEffect(() => {
    load(1, filters, true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Reload when filters change
  const handleFiltersChange = useCallback((f: FeedFilters) => {
    setFilters(f)
    setPage(1)
    setActiveIndex(0)
    setListings([])
    setHasMore(true)
    load(1, f, true)
    setStoreQuery(f.city || f.q)
  }, [load, setStoreQuery])

  // Track active card via IntersectionObserver
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const idx = cardRefs.current.findIndex((el) => el === entry.target)
            if (idx !== -1) setActiveIndex(idx)
          }
        }
      },
      { root: container, threshold: 0.6 },
    )

    const current = cardRefs.current.filter(Boolean) as HTMLDivElement[]
    current.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [listings.length])

  // Load next page when near the end
  useEffect(() => {
    if (activeIndex >= listings.length - 3 && hasMore && !loadingRef.current) {
      const next = page + 1
      setPage(next)
      load(next, filters)
    }
  }, [activeIndex, listings.length, hasMore, page, load, filters])

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      {/* Filter bar + view toggle */}
      <div className="relative z-50 flex items-center">
        <div className="flex-1 min-w-0">
          <FeedFilterBar filters={filters} onChange={handleFiltersChange} />
        </div>
        <button
          onClick={() => setViewMode((m) => m === 'full' ? 'portrait' : 'full')}
          title={viewMode === 'full' ? 'Switch to portrait' : 'Switch to full screen'}
          className="shrink-0 flex items-center gap-1.5 h-9 px-3 mr-3 rounded-full border border-[#E8E6E1] bg-white text-[#6B6B6B] hover:border-[#1C3829] hover:text-[#1C3829] transition-colors text-xs font-medium"
        >
          {viewMode === 'full' ? <Smartphone size={14} /> : <Maximize2 size={14} />}
          <span className="hidden sm:inline">{viewMode === 'full' ? 'Portrait' : 'Expand'}</span>
        </button>
      </div>

      {/* Scrollable feed — isolation:isolate keeps card z-indexes from escaping above the filter bar */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-scroll snap-y snap-mandatory"
        style={{ scrollbarWidth: 'none', isolation: 'isolate' }}
      >
        {listings.map((property, i) => (
          <div
            key={`${property.id}-${i}`}
            ref={(el) => { cardRefs.current[i] = el }}
            className="h-full snap-start snap-always flex-shrink-0"
          >
            <FeedCard
              property={property}
              isActive={activeIndex === i}
              viewMode={viewMode}
            />
          </div>
        ))}

        {/* Loading indicator */}
        {loading && (
          <div className="h-full snap-start flex items-center justify-center bg-[#FAF9F6]">
            <Loader2 size={32} className="text-[#1C3829] animate-spin" />
          </div>
        )}

        {/* Empty state */}
        {!loading && listings.length === 0 && (
          <div className="h-full snap-start flex flex-col items-center justify-center bg-[#FAF9F6] gap-4">
            <p className="text-[#6B6B6B] text-sm">No listings found for these filters.</p>
            <button
              onClick={() => handleFiltersChange(DEFAULT_FILTERS)}
              className="text-sm font-semibold text-[#1C3829] underline"
            >
              Clear filters
            </button>
          </div>
        )}

        {/* End of feed */}
        {!hasMore && listings.length > 0 && (
          <div className="h-40 snap-start flex items-center justify-center bg-[#FAF9F6]">
            <p className="text-[#6B6B6B] text-sm">You&apos;ve seen everything.</p>
          </div>
        )}
      </div>
    </div>
  )
}
