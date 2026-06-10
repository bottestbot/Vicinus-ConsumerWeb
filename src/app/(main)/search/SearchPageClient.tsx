'use client'

import { useQuery } from '@tanstack/react-query'
import dynamic from 'next/dynamic'
import { useSearchStore } from '@/store/searchStore'
import type { Property } from '@/types/search'
import { searchProperties } from '@/lib/api/search'
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
    price: (p.price as number | null) ?? 0,
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

export default function SearchPageClient() {
  const { viewMode, filters, query, mapBounds } = useSearchStore()

  const queryParams = {
    q: query || undefined,
    minPrice: filters.minPrice ?? undefined,
    maxPrice: filters.maxPrice ?? undefined,
    beds: filters.beds ?? undefined,
    baths: filters.baths ?? undefined,
    propertyType: filters.propertyType.length > 0 ? filters.propertyType.join(',') : undefined,
    status: filters.status || undefined,
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

  const { data, isLoading } = useQuery({
    queryKey: ['search', queryParams],
    queryFn: () => searchProperties(queryParams).then((r) => r.data),
    staleTime: 60_000,
    placeholderData: (prev) => prev,
  })

  const properties: Property[] = (
    (data?.data ?? []) as ApiProperty[]
  ).map(toFrontendProperty)

  const totalCount: number = data?.total ?? 0

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
            <MapView properties={properties} fitSignal={query} />
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
            />
          </div>
        )}
      </div>
    </div>
  )
}
