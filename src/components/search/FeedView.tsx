'use client'

import { useEffect, useRef, useState } from 'react'
import { useInfiniteQuery, keepPreviousData } from '@tanstack/react-query'
import { Loader2, Maximize2, Smartphone } from 'lucide-react'
import FeedCard from '@/components/feed/FeedCard'
import { searchProperties, type SearchParams } from '@/lib/api/search'
import type { Property } from '@/types/search'

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
        // Keep any http(s) media URL. DDF images live on unbounded third-party
        // hosts (onikon storyboard, realtyninja, agent CMS) whose URLs often
        // have no file extension — matching Search, we don't require one, and
        // only exclude obvious non-photo tours (matterport). A dead host is
        // handled by FeedCard's onError fallback rather than pre-filtered here.
        .filter((u) => /^https?:\/\//i.test(u) && !/matterport\.com/i.test(u))
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

// One page of the feed: media-bearing listings (video first), plus the raw
// count so pagination keys off the API page size, not the filtered length.
function toFeedPage(raw: RawListing[]): { items: Property[]; rawCount: number } {
  const items = raw
    .map(mapListing)
    .filter((p) => p.images.length > 0 || p.virtualTourUrl || p.youtubeUrl)
    .sort((a, b) => {
      const aVideo = a.youtubeUrl || a.virtualTourUrl ? 1 : 0
      const bVideo = b.youtubeUrl || b.virtualTourUrl ? 1 : 0
      return bVideo - aVideo
    })
  return { items, rawCount: raw.length }
}

export interface FeedViewProps {
  /** Search params derived from the shared Buy filters (FilterPanel + store).
   *  The feed reloads whenever these change. */
  params: SearchParams
}

/**
 * The vertical, TikTok-style listing feed — now a *view* of the Buy screen
 * rather than a standalone route. It renders only the scroll body + a
 * portrait/full toggle; the navbar and filter bar are owned by the Buy shell,
 * and filters flow in via `params` so switching Feed↔Map keeps the same query.
 */
export default function FeedView({ params }: FeedViewProps) {
  const [viewMode, setViewMode] = useState<'full' | 'portrait'>('full')
  const [activeIndex, setActiveIndex] = useState(0)

  const containerRef = useRef<HTMLDivElement>(null)
  const cardRefs = useRef<(HTMLDivElement | null)[]>([])

  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } = useInfiniteQuery({
    // Structural key — React Query deep-compares the params object.
    queryKey: ['feed', params],
    queryFn: async ({ pageParam }) => {
      const res = await searchProperties({ ...params, page: pageParam, limit: PAGE_SIZE })
      const body = res.data as { data?: RawListing[] } | RawListing[]
      const raw: RawListing[] = Array.isArray(body)
        ? body
        : Array.isArray((body as { data?: RawListing[] }).data)
        ? (body as { data: RawListing[] }).data
        : []
      return toFeedPage(raw)
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.rawCount === PAGE_SIZE ? allPages.length + 1 : undefined,
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  })

  const listings: Property[] = data?.pages.flatMap((p) => p.items) ?? []

  // Track the active card and drive infinite scroll off it.
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

  // Prefetch the next page as the user nears the end of the loaded set.
  useEffect(() => {
    if (activeIndex >= listings.length - 3 && hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [activeIndex, listings.length, hasNextPage, isFetchingNextPage, fetchNextPage])

  return (
    <div className="relative h-full">
      {/* View toggle — labelled by the mode you'll switch *to*, so it reads as
          an action rather than an ambiguous status. */}
      <button
        onClick={() => setViewMode((m) => (m === 'full' ? 'portrait' : 'full'))}
        aria-label={viewMode === 'full' ? 'Switch to phone view' : 'Switch to full screen'}
        title={viewMode === 'full' ? 'Switch to phone view' : 'Switch to full screen'}
        className="absolute top-20 right-3 sm:right-4 z-40 flex items-center gap-1.5 h-9 px-3 rounded-full border border-[#E8E6E1] bg-white/90 backdrop-blur text-[#6B6B6B] hover:border-[#1C3829] hover:text-[#1C3829] focus-visible:ring-2 focus-visible:ring-[#1C3829] transition-colors text-xs font-medium shadow-sm"
      >
        {viewMode === 'full' ? <Smartphone size={14} /> : <Maximize2 size={14} />}
        <span className="hidden sm:inline">{viewMode === 'full' ? 'Phone view' : 'Full screen'}</span>
      </button>

      {/* Scrollable feed — isolation:isolate keeps card z-indexes from escaping */}
      <div
        ref={containerRef}
        className="h-full overflow-y-scroll snap-y snap-mandatory"
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

        {/* Loading indicator (initial load or next page) */}
        {(isLoading || isFetchingNextPage) && (
          <div className="h-full snap-start flex items-center justify-center bg-[#FAF9F6]">
            <Loader2 size={32} className="text-[#1C3829] animate-spin" />
          </div>
        )}

        {/* Empty state */}
        {!isLoading && listings.length === 0 && (
          <div className="h-full snap-start flex flex-col items-center justify-center bg-[#FAF9F6] gap-4">
            <p className="text-[#6B6B6B] text-sm">No listings found for these filters.</p>
          </div>
        )}

        {/* End of feed */}
        {!hasNextPage && listings.length > 0 && (
          <div className="h-40 snap-start flex items-center justify-center bg-[#FAF9F6]">
            <p className="text-[#6B6B6B] text-sm">You&apos;ve seen everything.</p>
          </div>
        )}
      </div>
    </div>
  )
}
