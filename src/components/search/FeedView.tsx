'use client'

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import { useRouter } from 'next/navigation'
import { useInfiniteQuery } from '@tanstack/react-query'
import { useUser } from '@clerk/nextjs'
import { Loader2, Maximize2, Minimize2, Smartphone } from 'lucide-react'
import FeedCard from '@/components/feed/FeedCard'
import { searchProperties, type SearchParams } from '@/lib/api/search'
import { saveProperty, unsaveProperty } from '@/lib/api/users'
import { useUserStore } from '@/store/userStore'
import { track } from '@/lib/analytics/capture'
import type { Property, OpenHouseSummary, ListingVideo } from '@/types/search'

// One request costs ~700ms of fixed overhead (DDF round-trip + the open-house
// and agent joins) and only ~14ms per 10 extra listings, so a big page is far
// cheaper than chaining small ones. At 50, a videoOnly page yields ~13–27
// playable reels — many fetches' worth of runway from a single call.
const PAGE_SIZE = 50

// Prefetch the next page once fewer than this many unwatched reels remain, so
// the buffer refills mid-scroll instead of at the end of the loaded set.
// Safari still ships the prefixed Fullscreen API; typed here rather than cast
// inline so the feature-detection reads as intent instead of an `any`.
type DocumentWithWebkitFullscreen = Document & { webkitFullscreenEnabled?: boolean }
type ElementWithWebkitFullscreen = HTMLDivElement & {
  webkitRequestFullscreen?: () => Promise<void> | void
}

// Stable module-level store accessors — inline closures would resubscribe on
// every render.
const subscribeNever = () => () => {}
const getServerFalse = () => false
const getFullscreenSupported = () =>
  document.fullscreenEnabled ||
  !!(document as DocumentWithWebkitFullscreen).webkitFullscreenEnabled
const getIsFullscreen = () => !!document.fullscreenElement
const subscribeFullscreen = (onChange: () => void) => {
  document.addEventListener('fullscreenchange', onChange)
  document.addEventListener('webkitfullscreenchange', onChange)
  return () => {
    document.removeEventListener('fullscreenchange', onChange)
    document.removeEventListener('webkitfullscreenchange', onChange)
  }
}

const REEL_BUFFER = 3

// Stop auto-paging after this many consecutive pages that added no reels, so a
// low-supply query ends instead of spinning. See the barren-run guard below.
const BARREN_PAGE_LIMIT = 2

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
  video?: ListingVideo | null
  leaseAmount?: number | null
  leaseFrequency?: string | null
  openHouse?: OpenHouseSummary | null
}

function mapListing(l: RawListing): Property {
  const rawImages = Array.isArray(l.images)
    ? (l.images as Array<{ url?: string } | string>)
        .map((m) => (typeof m === 'string' ? m : (m.url ?? '')))
        // Keep any http(s) media URL. DDF images live on unbounded third-party
        // hosts (onikon storyboard, realtyninja, agent CMS) whose URLs often
        // have no file extension — matching Search, we don't require one, and
        // only exclude obvious non-photo tours (matterport). A dead host is
        // handled by FeedCard's onError fallback rather than pre-filtered here.
        .filter((u) => /^https?:\/\//i.test(u) && !/matterport\.com/i.test(u))
    : []
  // DDF repeats the same media URL across rows on some listings, which showed
  // up as a duplicated slide (and a React key collision) in the carousel.
  const images = Array.from(new Set(rawImages))

  const allowedStatus = ['Active', 'Sold', 'Coming Soon', 'Open House'] as const
  const rawStatus = l.status ?? 'Active'
  const status = (allowedStatus.includes(rawStatus as never) ? rawStatus : 'Active') as Property['status']

  return {
    id: String(l.id ?? l.ddfListingKey ?? ''),
    address: l.address ?? '',
    city: l.city ?? '',
    province: l.province ?? '',
    postalCode: l.postalCode ?? '',
    // Rentals carry leaseAmount instead of price — fall back so rent shows.
    price: l.price ?? l.leaseAmount ?? 0,
    beds: l.beds ?? 0,
    baths: l.baths ?? 0,
    sqft: l.sqft ?? 0,
    propertyType: l.propertySubType ?? '',
    status,
    daysOnMarket: 0,
    listingType: l.leaseAmount != null ? 'For Rent' : 'For Sale',
    leaseFrequency: l.leaseAmount != null ? (l.leaseFrequency ?? 'Monthly') : null,
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
    video: l.video ?? null,
    openHouse: l.openHouse ?? null,
  }
}

// One page of the feed: reels only.
//
// The API already returns just the playable ones (`videoOnly` narrows DDF to
// the 'Video Tour Website' category, then it over-fetches and drops the
// Matterport tours and agent landing pages that category also holds). The
// `p.video` guard is a belt-and-braces check so a card can never render with
// nothing to play.
//
// `hasMore` comes from the API because the returned length can't imply the end
// of the feed — it's a trimmed count, so a thin page is not the last page.
function toFeedPage(raw: RawListing[], hasMore: boolean): { items: Property[]; hasMore: boolean } {
  return { items: raw.map(mapListing).filter((p) => p.video), hasMore }
}

export interface FeedViewProps {
  /** Search params derived from the shared Buy filters (FilterPanel + store).
   *  The feed reloads whenever these change. */
  params: SearchParams
  /** Set when arriving from a shared reel link (/reel/[id]) — that listing is
   *  hoisted to the front so the recipient lands on the reel that was shared
   *  rather than wherever it happens to sort. See `listings` below. */
  pinnedReelId?: string
}

/**
 * The vertical, TikTok-style listing feed — now a *view* of the Buy screen
 * rather than a standalone route. It renders only the scroll body + a
 * portrait/full toggle; the navbar and filter bar are owned by the Buy shell,
 * and filters flow in via `params` so switching Feed↔Map keeps the same query.
 */
export default function FeedView({ params, pinnedReelId }: FeedViewProps) {
  const [viewMode, setViewMode] = useState<'full' | 'portrait'>('full')
  const [activeIndex, setActiveIndex] = useState(0)

  const router = useRouter()
  const { isSignedIn } = useUser()
  const { savedPropertyIds, toggleSaved } = useUserStore()

  const containerRef = useRef<HTMLDivElement>(null)
  const cardRefs = useRef<(HTMLDivElement | null)[]>([])

  // Mirrors MapListingPopup's save pattern: only flip the store once the
  // write actually succeeds, and redirect signed-out users instead of
  // silently no-oping the tap.
  async function handleSave(id: string) {
    if (!isSignedIn) {
      router.push(`/sign-in?redirect=/feed`)
      return
    }
    try {
      const wasSaved = savedPropertyIds.has(id)
      if (wasSaved) await unsaveProperty(id)
      else await saveProperty(id)
      toggleSaved(id)
      track(wasSaved ? 'property_unsaved' : 'property_saved', { listing_key: id, surface: 'feed_card' })
    } catch {
      // Leave state untouched; the tap silently did nothing on the backend.
    }
  }

  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } = useInfiniteQuery({
    // Structural key — React Query deep-compares the params object. No
    // placeholderData here on purpose: a city change should read as a fresh
    // load (clear the old city's cards, show the spinner, load the new one)
    // rather than keeping stale cards on screen mid-fetch — simpler than
    // reconciling scroll position against data that's about to be replaced,
    // and the empty state has nothing stale left to scroll through.
    queryKey: ['feed', params],
    queryFn: async ({ pageParam }) => {
      const res = await searchProperties({ ...params, videoOnly: true, page: pageParam, limit: PAGE_SIZE })
      const body = res.data as { data?: RawListing[]; hasMore?: boolean } | RawListing[]
      const raw: RawListing[] = Array.isArray(body)
        ? body
        : Array.isArray((body as { data?: RawListing[] }).data)
        ? (body as { data: RawListing[] }).data
        : []
      // A bare-array response (no envelope) can't tell us — assume a full page means more.
      const hasMore = Array.isArray(body)
        ? body.length >= PAGE_SIZE
        : (body.hasMore ?? false)
      return toFeedPage(raw, hasMore)
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.hasMore ? allPages.length + 1 : undefined,
    staleTime: 60_000,
  })

  // Hoist a shared reel to the front. The pin is a reorder of what the feed
  // already loaded, not a separate fetch: `video` only comes back on search
  // results (the detail endpoint doesn't carry it), so there is no way to
  // materialise one reel on its own. In practice the reel is nearly always
  // here — the reel page scopes the feed to that listing's own city and a page
  // is PAGE_SIZE listings deep. When it genuinely isn't (filtered out, or sorted
  // past the first page), the recipient still gets that city's feed rather than
  // an error, and the page's "See full listing" link still reaches the listing.
  const listings: Property[] = useMemo(() => {
    const all = data?.pages.flatMap((p) => p.items) ?? []
    if (!pinnedReelId) return all
    const i = all.findIndex((p) => p.id === pinnedReelId)
    if (i <= 0) return all
    return [all[i], ...all.slice(0, i), ...all.slice(i + 1)]
  }, [data, pinnedReelId])

  // A new city/filter search should start fresh at the top, not leave the
  // viewer scrolled to wherever they were in the previous city's feed.
  const paramsKey = JSON.stringify(params)
  useEffect(() => {
    setActiveIndex(0)
    containerRef.current?.scrollTo({ top: 0 })
  }, [paramsKey])

  // Track the active card and drive infinite scroll off it.
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const idx = cardRefs.current.findIndex((el) => el === entry.target)
            if (idx !== -1) {
              setActiveIndex(idx)
              const listing = listings[idx]
              if (listing) track('feed_card_impression', { listing_key: listing.id, position: idx })
            }
          }
        }
      },
      { root: container, threshold: 0.6 },
    )

    const current = cardRefs.current.filter(Boolean) as HTMLDivElement[]
    current.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [listings.length])

  // Refill the buffer while the viewer still has reels left to watch: once
  // fewer than REEL_BUFFER remain ahead of them, fetch in the background so the
  // next one is already loaded rather than making them wait at the end.
  //
  // The barren-run guard is load-bearing. A thin query (a free-text city with
  // little video stock) can return pages that add nothing while still
  // reporting hasMore, and the buffer condition stays true the whole time — so
  // this would chase page after page at seconds apiece and read as an endless
  // spinner. After BARREN_PAGE_LIMIT fruitless pages we stop and show what we
  // have; scrolling to the end still resets it and tries again.
  const reelsRemaining = listings.length - 1 - activeIndex
  const barrenPages = useRef(0)
  const lastCount = useRef(0)
  useEffect(() => {
    if (listings.length > lastCount.current) barrenPages.current = 0
    else if (!isFetchingNextPage && data?.pages.length) barrenPages.current += 1
    lastCount.current = listings.length
  }, [listings.length, isFetchingNextPage, data?.pages.length])

  useEffect(() => {
    if (
      reelsRemaining < REEL_BUFFER &&
      hasNextPage &&
      !isFetchingNextPage &&
      barrenPages.current < BARREN_PAGE_LIMIT
    ) {
      fetchNextPage()
    }
  }, [reelsRemaining, hasNextPage, isFetchingNextPage, fetchNextPage])

  // Fullscreen (mobile). Both values are client-only facts, so they're read
  // through useSyncExternalStore: the server snapshot is `false`, which keeps
  // hydration honest without a setState-in-effect cascade.
  const rootRef = useRef<HTMLDivElement>(null)
  const canFullscreen = useSyncExternalStore(
    subscribeNever,
    getFullscreenSupported,
    getServerFalse,
  )
  // The viewer can leave fullscreen by gesture or Esc without touching our
  // button, so mirror the browser's state rather than tracking our own.
  const isFullscreen = useSyncExternalStore(
    subscribeFullscreen,
    getIsFullscreen,
    getServerFalse,
  )

  // `fullscreenEnabled` is necessary but not sufficient — an embedding context
  // can advertise support and still reject the request with a permissions
  // error. Retire the control the first time that happens rather than leaving
  // a button that does nothing every time it's pressed.
  const [fullscreenBlocked, setFullscreenBlocked] = useState(false)

  const toggleFullscreen = () => {
    const el = rootRef.current as ElementWithWebkitFullscreen | null
    if (!el) return
    if (document.fullscreenElement) {
      void document.exitFullscreen?.()
      return
    }
    try {
      const req = el.requestFullscreen?.() ?? el.webkitRequestFullscreen?.()
      // Promise-returning on modern browsers; the prefixed form may be sync.
      void Promise.resolve(req).catch(() => setFullscreenBlocked(true))
    } catch {
      setFullscreenBlocked(true)
    }
  }

  // No display utility here on purpose — each button sets its own, so the
  // breakpoint rule can't collide with a stray `flex` in the shared string.
  const controlClass =
    'absolute top-32 md:top-20 right-3 sm:right-4 z-40 items-center gap-1.5 h-9 px-3 rounded-full border border-[#E8E6E1] bg-white/90 backdrop-blur text-[#6B6B6B] hover:border-[#1C3829] hover:text-[#1C3829] focus-visible:ring-2 focus-visible:ring-[#1C3829] transition-colors text-xs font-medium shadow-sm'

  return (
    <div ref={rootRef} className="relative h-full">
      {/* Phone-view toggle — desktop only. Constraining the feed to a phone-width
          column is what makes a reel readable on a wide monitor; on a phone the
          viewport already *is* that column, so the control has nothing to do.
          Labelled by the mode you'll switch *to*, so it reads as an action.
          top-32 until md: below that the search bar stacks its input onto its
          own row and grows to ~98px, so top-20 would sit underneath it. */}
      <button
        onClick={() => setViewMode((m) => (m === 'full' ? 'portrait' : 'full'))}
        aria-label={viewMode === 'full' ? 'Switch to phone view' : 'Switch to full screen'}
        title={viewMode === 'full' ? 'Switch to phone view' : 'Switch to full screen'}
        className={`hidden sm:flex ${controlClass}`}
      >
        {viewMode === 'full' ? <Smartphone size={14} /> : <Maximize2 size={14} />}
        <span className="hidden sm:inline">{viewMode === 'full' ? 'Phone view' : 'Full screen'}</span>
      </button>

      {/* Mobile gets real fullscreen instead: the win on a phone is reclaiming
          the browser's URL and tab chrome, which is vertical space the reel can
          actually use. Rendered only where the Fullscreen API exists — iPhone
          Safari supports it on <video> elements but not on a container, so the
          button would be dead there and is hidden rather than shown broken. */}
      {canFullscreen && !fullscreenBlocked && (
        <button
          onClick={toggleFullscreen}
          aria-label={isFullscreen ? 'Exit full screen' : 'Enter full screen'}
          title={isFullscreen ? 'Exit full screen' : 'Enter full screen'}
          className={`flex sm:hidden ${controlClass}`}
        >
          {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
        </button>
      )}

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
              isNear={Math.abs(i - activeIndex) <= 1}
              viewMode={viewMode}
              isSaved={savedPropertyIds.has(property.id)}
              onSave={handleSave}
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
