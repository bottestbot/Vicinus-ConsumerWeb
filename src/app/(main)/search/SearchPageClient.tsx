'use client'

import { useEffect, useRef, useState } from 'react'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import dynamic from 'next/dynamic'
import { Loader2 } from 'lucide-react'
import { useSearchStore } from '@/store/searchStore'
import type { Property, MapPinResponse } from '@/types/search'
import { propertyTypeLabel } from '@/types/search'
import { searchProperties, getMapPins, type SearchParams } from '@/lib/api/search'
import { filtersToSearchParams } from '@/lib/searchFilters'
import { geocodeCity, geocodeAddress, parseAddress } from '@/lib/geocode'
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
    // Prefer StructureType (real dwelling form) over PropertySubType, which
    // files condos/townhouses all as "Single Family". Same map as the filter.
    propertyType: propertyTypeLabel(p.structureType as string[] | null, p.propertySubType as string | null),
    status: ((p.status as string | null) ?? 'Active') as Property['status'],
    daysOnMarket,
    listingType: p.leaseAmount != null ? 'For Rent' : 'For Sale',
    leaseFrequency:
      p.leaseAmount != null ? ((p.leaseFrequency as string | null) ?? 'Monthly') : null,
    latitude: (p.lat as number | null) ?? 0,
    longitude: (p.lng as number | null) ?? 0,
    imageUrl: mediaArr[0]?.url ?? '',
    images: mediaArr.map((m) => m.url),
    agentName: agent?.fullName ?? '',
    agentTitle: 'REALTOR®',
    brokerageName: office?.name ?? '',
    mlsNumber: (p.ddfListingId as string | null) ?? String(p.id),
    // DDF attribution: without this the "Powered by REALTOR.ca" badge on every
    // search card falls back to the REALTOR.ca homepage instead of deep-linking
    // the listing, which does not satisfy the attribution requirement. The API
    // has always returned this field — the mapper just never carried it.
    realtorUrl: (p.realtorUrl as string | null) ?? null,
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
  // NBHDCTA-02: set when arriving from a neighbourhood's "Explore Listings" CTA
  // — a bbox around that neighbourhood's centroid, and its name for the results
  // header (a neighbourhood name isn't a searchable city/address `q`).
  bbox?: string | null
  locationLabel?: string
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
  const {
    viewMode,
    filters,
    query,
    mapBounds,
    userCity,
    mapCity,
    userCoords,
    setQuery,
    setFilter,
    setViewMode,
    setGeocodedCenter,
  } = useSearchStore()

  // Wherever the user last panned the map takes priority over their actual
  // device location, so Feed and the location label stay in sync with the
  // Map view (panning North Van → Kelowna and switching to Feed should show
  // Kelowna, not the device's real city).
  const effectiveCity = mapCity || userCity

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

    // A full street address (e.g. arriving from the homepage hero search bar)
    // only means anything in the Map split-pane — force it, and fly to the
    // city instantly, then the exact address once Mapbox resolves it. Mirrors
    // SearchBar's flyToQuery for the in-page typed case — including the
    // addressResolved guard so a late city response can't clobber an address
    // zoom that already landed (the two requests race independently).
    if (initial.query) {
      if (parseAddress(initial.query).isFullAddress) {
        setViewMode('both')
        let addressResolved = false
        geocodeAddress(initial.query).then((c) => {
          if (!c) return
          addressResolved = true
          setGeocodedCenter({ ...c, zoom: 16 })
        })
        geocodeCity(initial.query).then((c) => {
          if (c && !addressResolved) setGeocodedCenter(c)
        })
      } else {
        // A city/neighbourhood search from the homepage hero bar belongs in
        // the Feed. Explicit, not just "leave the default" — the store is a
        // singleton that can still be sitting on 'both' from an address
        // search earlier in the session.
        setViewMode('list')
      }
    }
  }, [initial, setQuery, setFilter, setViewMode, setGeocodedCenter])

  // NBHDCTA-02: a neighbourhood's "Explore Listings" CTA arrives with a locked
  // bbox around that neighbourhood's centroid (computed server-side in
  // page.tsx). It takes priority over the geolocation/Vancouver default so the
  // first render is actually scoped to the neighbourhood — but once the user
  // pans the map, `mapBoundsStr` below takes over as normal.
  const lockedBbox = initial?.bbox ?? null

  // Effective bounding box when browsing (no text query). Priority:
  // live map bounds > neighbourhood CTA lock > device location > Vancouver
  // fallback. This scopes both the Feed and the map pins so that, with no
  // search and no geolocation, Buy loads Vancouver listings instead of a
  // global "All Properties" set (BUY-03).
  const mapBoundsStr = mapBounds
    ? `${mapBounds.west},${mapBounds.south},${mapBounds.east},${mapBounds.north}`
    : null
  const defaultBbox =
    mapBoundsStr ??
    lockedBbox ??
    (userCoords
      ? bboxAround(userCoords.longitude, userCoords.latitude)
      : bboxAround(VANCOUVER.longitude, VANCOUVER.latitude))

  // A full street address ("8760 No 5 Rd, Richmond, BC V6Y 2V4") will never
  // substring-match a DDF listing's UnparsedAddress/City/PostalCode field, so
  // the normal text-search path (`q`, no bbox) always returns zero results for
  // one. Treat it like browsing at that location instead: drop `q` and scope
  // by the (address-centred, once the map flies there) bbox so nearby active
  // listings show up.
  const isAddressQuery = query ? parseAddress(query).isFullAddress : false

  // For an address query, scope strictly to the real (address-centred) map
  // bounds once the flyTo lands — NEVER fall back to userCoords/Vancouver like
  // `defaultBbox` does for plain browsing. Falling back to the user's own
  // location here was the actual bug: on the first fetch (before mapBounds
  // catches up with the flyTo), it would briefly search/fit near the user's
  // real location instead of the searched address, reading as "search snaps
  // back to my location". `enabled` below withholds the fetch entirely until
  // mapBoundsStr reflects the real target, so there's nothing to snap from.
  const addressBbox = isAddressQuery ? mapBoundsStr : null

  const baseParams = filtersToSearchParams(filters, query)
  const queryParams = {
    ...baseParams,
    q: isAddressQuery ? undefined : baseParams.q,
    // Only constrain by area when the user is browsing (no text query) or the
    // query is a street address. A city/neighbourhood text search should
    // return that city's listings regardless of where the map currently sits,
    // then the map flies to them. When browsing, fall back to the device
    // location / Vancouver box so results are never global.
    bbox: !query ? defaultBbox : (isAddressQuery ? addressBbox ?? undefined : undefined),
  }

  // Params for the Feed view. Normally city-scoped rather than bbox-bound (the
  // feed has no map): a text search drives `city`, and when browsing we default
  // to the device city / Vancouver so the feed is never global. But a locked
  // neighbourhood bbox (NBHDCTA-02) takes priority over the city default — a
  // neighbourhood name isn't a `city` DDF can filter on, so bbox is the only way
  // to scope the feed to it. Shares the store filters so switching Feed↔Map
  // keeps the query.
  const feedParams: SearchParams = {
    ...queryParams,
    bbox: isAddressQuery ? addressBbox ?? undefined : (!query && lockedBbox ? lockedBbox : undefined),
    status: queryParams.status || 'Active',
    city: (query && !isAddressQuery) || lockedBbox ? undefined : (effectiveCity || 'Vancouver'),
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
    // Feed, which loads its own data via FeedView. For an address query, also
    // withhold the fetch until the real map bounds land (see addressBbox) —
    // otherwise there's a brief window with no bbox to scope by at all.
    enabled: viewMode === 'both' && (!isAddressQuery || !!addressBbox),
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  })

  const properties: Property[] = ((data?.data ?? []) as ApiProperty[]).map(toFrontendProperty)
  const totalCount: number = data?.total ?? 0
  const totalPages: number = data?.totalPages ?? Math.max(1, Math.ceil(totalCount / PAGE_SIZE))

  // Map pins: ALL listings in the current viewport (up to 500). Runs in parallel
  // with the feed — it's a separate query, and the feed renders off its own
  // request regardless. Measured: a concurrent 500-row pins request adds no
  // meaningful latency to the feed response, so there's no need to defer it;
  // firing both immediately keeps pins warm for an instant Feed→Map switch
  // (BUY-04). Any first-load slowness is API cold-start, not pin contention.
  // Same rule as queryParams above: an address query must never fall back to
  // defaultBbox's userCoords/Vancouver chain, or pins would briefly show the
  // user's own area instead of nothing while waiting for the real address bbox.
  const bbox = isAddressQuery ? addressBbox : (mapBoundsStr ?? defaultBbox)
  const pinParams = { ...queryParams, bbox: bbox ?? undefined }
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
      <Navbar />

      {/* ── Main body: Feed (default) or Map (split-pane), with the floating
          glass filter bar overlaid on top ──────────────────────────────── */}
      <div className="relative flex-1 flex overflow-hidden">
        {/* Floating translucent filter bar — overlays the Feed/Map instead of
            reserving its own strip. In Map view (desktop) it's confined to the
            map pane so it doesn't run over the 42% results list. */}
        <div
          className={[
            'absolute top-3 left-3 right-3 sm:top-4 sm:left-4 sm:right-4 z-30 pointer-events-none',
            viewMode === 'both' ? 'md:right-[calc(min(42%,480px)+1rem)]' : '',
          ].join(' ')}
        >
          {/* @container: the bar switches to its single-row layout on its own
              width, not the viewport's — in Map view it's confined to the map
              pane and is far narrower than the screen. */}
          <div className="pointer-events-auto @container">
            {/* Adaptive glass: light frosted bar on the Map (light map + white
                list), dark bar on the Feed (dark photo/video media). */}
            <FilterPanel theme={viewMode === 'both' ? 'light' : 'dark'} />
          </div>
        </div>

        {viewMode === 'list' ? (
          /* Feed view — full-width vertical listing feed */
          <div className="w-full h-full">
            <FeedView params={feedParams} />
          </div>
        ) : (
          <>
            {/* Map pane — full-width on mobile; on desktop it fills whatever
                space the (width-capped) list pane doesn't use */}
            <div className="relative overflow-hidden h-full w-full md:flex-1">
              {/* Only signal a fit once the data for this query is fresh — while
                  `keepPreviousData` shows the prior city's listings, suppress the
                  signal so the map doesn't fly to the wrong (stale) results. */}
              <MapView properties={properties} pins={pins} fitSignal={isPlaceholderData ? '' : query} />

              {/* Same keepPreviousData gap as the fitSignal above: the map keeps
                  rendering the prior city's pins with nothing showing a new
                  query is in flight. Surface it so a city switch doesn't look
                  like it did nothing. */}
              {isPlaceholderData && (
                <div className="absolute inset-0 z-20 pointer-events-none flex items-start justify-center pt-6">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/90 backdrop-blur shadow-sm border border-[#E8E6E1]">
                    <Loader2 size={14} className="text-[#1C3829] animate-spin" />
                    <span className="text-xs font-medium text-[#1C3829]">Updating results…</span>
                  </div>
                </div>
              )}
            </div>

            {/* List pane — hidden on mobile (map + filter bar only). Capped at
                480px so cards stay a sane width on large screens (cf. Zillow) —
                the map pane (flex-1) absorbs any extra space instead. */}
            <div className="hidden md:block md:w-[42%] md:max-w-[480px] md:shrink-0 overflow-hidden border-l border-[#E8E6E1]">
              <ResultsList
                properties={properties}
                totalCount={totalCount}
                locationLabel={query || initial?.locationLabel || effectiveCity || 'Vancouver'}
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
