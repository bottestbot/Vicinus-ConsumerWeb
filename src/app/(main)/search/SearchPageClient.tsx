'use client'

import { useEffect, useRef, useState } from 'react'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import dynamic from 'next/dynamic'
import { useSearchStore } from '@/store/searchStore'
import type { Property, MapPinResponse } from '@/types/search'
import { searchProperties, getMapPins, type SearchParams } from '@/lib/api/search'
import FilterPanel from '@/components/search/FilterPanel'
import ResultsList from '@/components/search/ResultsList'
import FeedView from '@/components/search/FeedView'
import Navbar from '@/components/layout/Navbar'

// Dynamically import map to avoid SSR issues with mapbox-gl
const MapView = dynamic(() => import('@/components/search/MapView'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-[#1C2020] flex items-center justify-center">
      <div className="text-white/40 text-sm">Loading map…</div>
    </div>
  ),
})

type ApiProperty = Record<string, unknown>

interface SearchResponse {
  data: ApiProperty[]
  total: number
  page: number
  limit: number
  totalPages: number
}

const PAGE_SIZE = 20

function toFrontendProperty(p: ApiProperty): Property {
  const mediaArr = (p.images as Array<{ url: string }> | null) ?? []
  const listedAt = p.listedAt ? new Date(p.listedAt as string) : null
  const daysOnMarket = listedAt
    ? Math.max(0, Math.floor((Date.now() - listedAt.getTime()) / 86_400_000))
    : 0
  const agent = p.agent as { fullName: string } | null
  const office = p.office as { name: string } | null

  return {
    id: String(p.id),
    address: (p.address as string | null) ?? '',
    city: (p.city as string | null) ?? '',
    province: (p.province as string | null) ?? '',
    postalCode: (p.postalCode as string | null) ?? '',
    // Rentals carry leaseAmount instead of price — fall back so rent shows.
    price: (p.price as number | null) ?? (p.leaseAmount as number | null) ?? 0,
    beds: (p.beds as number | null) ?? 0,
    baths: (p.baths as number | null) ?? 0,
    sqft: (p.sqft as number | null) ?? 0,
    propertyType: (p.propertySubType as string | null) ?? '',
    status: ((p.status as string | null) ?? 'Active') as Property['status'],
    daysOnMarket,
    listingType: p.leaseAmount != null ? 'For Rent' : 'For Sale',
    latitude: (p.lat as number | null) ?? 0,
    longitude: (p.lng as number | null) ?? 0,
    imageUrl: mediaArr[0]?.url ?? '',
    images: mediaArr.map((m) => m.url),
    agentName: agent?.fullName ?? '',
    agentTitle: 'REALTOR®',
    brokerageName: office?.name ?? '',
    mlsNumber: (p.ddfListingId as string | null) ?? String(p.id),
    yearBuilt: (p.yearBuilt as number | null) ?? undefined,
    parking: (p.parkingTotal as number | null) ?? undefined,
    stories: (p.stories as number | null) ?? undefined,
    description: (p.description as string | null) ?? undefined,
  }
}

export interface InitialSearch {
  query: string
  minPrice: number | null
  maxPrice: number | null
  beds: number | null
  baths: number | null
  propertyType: string[]
}

// Vancouver fallback (BUG-03 / BUY-03): used to scope default results when no
// city is searched and no device location is available. Matches the map's
// default center in searchStore.
const VANCOUVER = { longitude: -123.1207, latitude: 49.2827 }
// Roughly a metro-area box around a center point (±lng/±lat degrees).
function bboxAround(longitude: number, latitude: number): string {
  const dLng = 0.16
  const dLat = 0.09
  return `${longitude - dLng},${latitude - dLat},${longitude + dLng},${latitude + dLat}`
}

export default function SearchPageClient({ initial }: { initial?: InitialSearch }) {
  const { viewMode, filters, query, mapBounds, userCity, userCoords, setQuery, setFilter } =
    useSearchStore()

  // Hydrate the store from URL params (e.g. the home-page hero search) once on
  // mount so a city/price/type from the URL drives the initial results.
  const hydrated = useRef(false)
  useEffect(() => {
    if (hydrated.current || !initial) return
    hydrated.current = true
    if (initial.query) setQuery(initial.query)
    if (initial.minPrice !== null) setFilter('minPrice', initial.minPrice)
    if (initial.maxPrice !== null) setFilter('maxPrice', initial.maxPrice)
    if (initial.beds !== null) setFilter('beds', initial.beds)
    if (initial.baths !== null) setFilter('baths', initial.baths)
    if (initial.propertyType.length > 0) setFilter('propertyType', initial.propertyType)
  }, [initial, setQuery, setFilter])

  // Effective bounding box when browsing (no text query). Priority:
  // live map bounds > device location > Vancouver fallback. This scopes both the
  // Feed and the map pins so that, with no search and no geolocation, Buy loads
  // Vancouver listings instead of a global "All Properties" set (BUY-03).
  const mapBoundsStr = mapBounds
    ? `${mapBounds.west},${mapBounds.south},${mapBounds.east},${mapBounds.north}`
    : null
  const defaultBbox =
    mapBoundsStr ??
    (userCoords
      ? bboxAround(userCoords.longitude, userCoords.latitude)
      : bboxAround(VANCOUVER.longitude, VANCOUVER.latitude))

  const queryParams = {
    q: query || undefined,
    minPrice: filters.minPrice ?? undefined,
    maxPrice: filters.maxPrice ?? undefined,
    beds: filters.beds ?? undefined,
    baths: filters.baths ?? undefined,
    propertyType: filters.propertyType.length > 0 ? filters.propertyType.join(',') : undefined,
    structureType: filters.structureType.length > 0 ? filters.structureType.join(',') : undefined,
    status: filters.status || undefined,
    listingType: filters.listingType || undefined,
    minSqft: filters.minSqft ?? undefined,
    maxSqft: filters.maxSqft ?? undefined,
    parkingMin: filters.parking ?? undefined,
    yearBuiltMin: filters.minYearBuilt ?? undefined,
    // Only constrain by area when the user is browsing (no text query). A text
    // search should return that city's listings regardless of where the map
    // currently sits, then the map flies to them. When browsing, fall back to
    // the device location / Vancouver box so results are never global.
    bbox: !query ? defaultBbox : undefined,
  }

  // Params for the Feed view. Same filters as the list, but city-scoped rather
  // than bbox-bound (the feed has no map): a text search drives `city`, and when
  // browsing we default to the device city / Vancouver so the feed is never
  // global. Shares the store filters so switching Feed↔Map keeps the query.
  const feedParams: SearchParams = {
    ...queryParams,
    bbox: undefined,
    status: queryParams.status || 'Active',
    city: query ? undefined : (userCity || 'Vancouver'),
  }

  // Numbered pagination for the list pane. Reset to page 1 whenever the query
  // or filters change (serialised key) so a new search starts at the top.
  const [page, setPage] = useState(1)
  const filterKey = JSON.stringify(queryParams)
  useEffect(() => {
    setPage(1)
  }, [filterKey])

  const { data, isLoading, isPlaceholderData } = useQuery({
    queryKey: ['search', queryParams, page],
    queryFn: () =>
      searchProperties({ ...queryParams, page, limit: PAGE_SIZE }).then((r) => r.data as SearchResponse),
    // The list only renders in the Map (split-pane) view; skip the fetch on the
    // Feed, which loads its own data via FeedView.
    enabled: viewMode === 'both',
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  })

  const properties: Property[] = ((data?.data ?? []) as ApiProperty[]).map(toFrontendProperty)
  const totalCount: number = data?.total ?? 0
  const totalPages: number = data?.totalPages ?? Math.max(1, Math.ceil(totalCount / PAGE_SIZE))

  // Map pins: ALL listings in the current viewport (up to 500). In the Map view
  // they load immediately. On the Feed view we still prefetch them so switching
  // to Map has no API wait (BUY-04) — but *deferred*, so this heavy 500-row DDF
  // query doesn't compete with the feed's own first-page load on a cold API and
  // make the feed feel slow. Once armed it stays armed, keeping pins warm.
  const [pinsArmed, setPinsArmed] = useState(false)
  useEffect(() => {
    // Map view: arm now (0ms). Feed view: wait until the feed has had a chance
    // to paint before firing the background prefetch.
    const t = setTimeout(() => setPinsArmed(true), viewMode === 'both' ? 0 : 2500)
    return () => clearTimeout(t)
  }, [viewMode])

  const bbox = mapBoundsStr ?? defaultBbox
  const pinParams = { ...queryParams, bbox }
  const { data: pinsData } = useQuery({
    queryKey: ['map-pins', pinParams],
    queryFn: () => getMapPins(pinParams).then((r) => r.data as MapPinResponse[]),
    enabled: !!bbox && pinsArmed,
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  })
  const pins: MapPinResponse[] = pinsData ?? []

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-[#FAF9F6] font-ui">
      {/* ── Shared Navbar ─────────────────────────────────────────────────── */}
      <Navbar />

      {/* ── Filter Bar: SearchBar + filter chips + ViewToggle ────────────── */}
      <div className="shrink-0 z-10">
        <FilterPanel />
      </div>

      {/* ── Main body: Feed (default) or Map (split-pane) ────────────────── */}
      <div className="flex-1 flex overflow-hidden">
        {viewMode === 'list' ? (
          /* Feed view — full-width vertical listing feed */
          <div className="w-full h-full">
            <FeedView params={feedParams} />
          </div>
        ) : (
          <>
            {/* Map pane */}
            <div
              className="relative overflow-hidden h-full"
              style={{ width: '58%' }}
            >
              {/* Only signal a fit once the data for this query is fresh — while
                  `keepPreviousData` shows the prior city's listings, suppress the
                  signal so the map doesn't fly to the wrong (stale) results. */}
              <MapView properties={properties} pins={pins} fitSignal={isPlaceholderData ? '' : query} />
            </div>

            {/* List pane */}
            <div
              className="overflow-hidden border-l border-[#E8E6E1]"
              style={{ width: '42%' }}
            >
              <ResultsList
                properties={properties}
                totalCount={totalCount}
                locationLabel={query || userCity || 'Vancouver'}
                isLoading={isLoading || isPlaceholderData}
                page={page}
                totalPages={totalPages}
                onPageChange={setPage}
              />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
