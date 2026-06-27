'use client'

import { useEffect, useRef, useState } from 'react'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import dynamic from 'next/dynamic'
import { useSearchStore } from '@/store/searchStore'
import type { Property, MapPinResponse } from '@/types/search'
import { searchProperties, getMapPins } from '@/lib/api/search'
import FilterPanel from '@/components/search/FilterPanel'
import ResultsList from '@/components/search/ResultsList'
import DashboardNavbar from '@/components/dashboard/DashboardNavbar'

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

const PAGE_SIZE = 40

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

export default function SearchPageClient({ initial }: { initial?: InitialSearch }) {
  const { viewMode, filters, query, mapBounds, setQuery, setFilter } = useSearchStore()

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

  const queryParams = {
    q: query || undefined,
    minPrice: filters.minPrice ?? undefined,
    maxPrice: filters.maxPrice ?? undefined,
    beds: filters.beds ?? undefined,
    baths: filters.baths ?? undefined,
    propertyType: filters.propertyType.length > 0 ? filters.propertyType.join(',') : undefined,
    status: filters.status || undefined,
    listingType: filters.listingType || undefined,
    minSqft: filters.minSqft ?? undefined,
    maxSqft: filters.maxSqft ?? undefined,
    parkingMin: filters.parking ?? undefined,
    yearBuiltMin: filters.minYearBuilt ?? undefined,
    // Only constrain by the visible map area when the user is browsing the map
    // (no text query). A text search should return that city's listings
    // regardless of where the map currently sits, then the map flies to them.
    bbox: !query && mapBounds
      ? `${mapBounds.west},${mapBounds.south},${mapBounds.east},${mapBounds.north}`
      : undefined,
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
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  })

  const properties: Property[] = ((data?.data ?? []) as ApiProperty[]).map(toFrontendProperty)
  const totalCount: number = data?.total ?? 0
  const totalPages: number = data?.totalPages ?? Math.max(1, Math.ceil(totalCount / PAGE_SIZE))

  // Map pins: ALL listings in the current viewport (up to 500), independent of
  // the list page — so the map stays fully populated like Zillow's. Carries the
  // same filters as the list so applying a filter updates the map too.
  const bbox = mapBounds
    ? `${mapBounds.west},${mapBounds.south},${mapBounds.east},${mapBounds.north}`
    : undefined
  const pinParams = { ...queryParams, bbox }
  const { data: pinsData } = useQuery({
    queryKey: ['map-pins', pinParams],
    queryFn: () => getMapPins(pinParams).then((r) => r.data as MapPinResponse[]),
    enabled: !!bbox,
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  })
  const pins: MapPinResponse[] = pinsData ?? []

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-[#FAF9F6] font-ui">
      {/* ── Shared Navbar ─────────────────────────────────────────────────── */}
      <DashboardNavbar />

      {/* ── Filter Bar: SearchBar + filter chips + ViewToggle ────────────── */}
      <div className="shrink-0 z-10">
        <FilterPanel />
      </div>

      {/* ── Main Split Pane ──────────────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden">
        {/* Map pane */}
        {(viewMode === 'map' || viewMode === 'both') && (
          <div
            className="relative overflow-hidden h-full"
            style={{ width: viewMode === 'map' ? '100%' : '58%' }}
          >
            {/* Only signal a fit once the data for this query is fresh — while
                `keepPreviousData` shows the prior city's listings, suppress the
                signal so the map doesn't fly to the wrong (stale) results. */}
            <MapView properties={properties} pins={pins} fitSignal={isPlaceholderData ? '' : query} />
          </div>
        )}

        {/* List pane */}
        {(viewMode === 'list' || viewMode === 'both') && (
          <div
            className="overflow-hidden border-l border-[#E8E6E1]"
            style={{ width: viewMode === 'list' ? '100%' : '42%' }}
          >
            <ResultsList
              properties={properties}
              totalCount={totalCount}
              locationLabel={query || 'All Properties'}
              isLoading={isLoading}
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>
    </div>
  )
}
