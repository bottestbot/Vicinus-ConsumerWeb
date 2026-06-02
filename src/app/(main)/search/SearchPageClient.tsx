'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'
import { SignInButton, UserButton, useUser } from '@clerk/nextjs'
import { useSearchStore } from '@/store/searchStore'
import { MOCK_PROPERTIES } from '@/types/search'
import SearchBar from '@/components/search/SearchBar'
import FilterPanel from '@/components/search/FilterPanel'
import ViewToggle from '@/components/search/ViewToggle'
import ResultsList from '@/components/search/ResultsList'

// Dynamically import map to avoid SSR issues with mapbox-gl
const MapView = dynamic(() => import('@/components/search/MapView'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-[#1C2020] flex items-center justify-center">
      <div className="text-white/40 text-sm">Loading map…</div>
    </div>
  ),
})

export default function SearchPageClient() {
  const { viewMode, filters, query, mapBounds } = useSearchStore()
  const { isSignedIn } = useUser()

  // Filter properties based on current state
  // In production this calls the backend API via React Query
  const filteredProperties = MOCK_PROPERTIES.filter((p) => {
    if (filters.minPrice !== null && p.price < filters.minPrice) return false
    if (filters.maxPrice !== null && p.price > filters.maxPrice) return false
    if (filters.beds !== null && p.beds < filters.beds) return false
    if (filters.baths !== null && p.baths < filters.baths) return false
    if (filters.propertyType.length > 0 && !filters.propertyType.includes(p.propertyType)) return false
    if (filters.minSqft !== null && p.sqft < filters.minSqft) return false
    if (filters.maxSqft !== null && p.sqft > filters.maxSqft) return false
    if (filters.listingType && p.listingType !== filters.listingType) return false
    if (mapBounds) {
      if (
        p.longitude < mapBounds.west ||
        p.longitude > mapBounds.east ||
        p.latitude < mapBounds.south ||
        p.latitude > mapBounds.north
      ) return false
    }
    if (query) {
      const q = query.toLowerCase()
      if (
        !p.city.toLowerCase().includes(q) &&
        !p.address.toLowerCase().includes(q) &&
        !p.postalCode.toLowerCase().includes(q)
      ) return false
    }
    return true
  })

  return (
    // Full-viewport overlay — sits above the main layout's Navbar
    <div className="fixed inset-0 z-[60] flex flex-col bg-[#FAF9F6] font-ui">
      {/* ── Search Navbar ─────────────────────────────────────────────────── */}
      <header className="h-14 bg-white border-b border-[#E8E6E1] flex items-center gap-3 px-4 shrink-0 z-10">
        {/* Brand */}
        <Link
          href="/"
          className="font-heading text-[#111111] text-sm font-semibold tracking-widest uppercase whitespace-nowrap mr-2"
        >
          The Intelligent Curator
        </Link>

        {/* Search bar — grows to fill available space */}
        <div className="flex-1 max-w-xl">
          <SearchBar />
        </div>

        {/* Nav links */}
        <nav className="hidden lg:flex items-center gap-5 text-xs text-[#6B6B6B] whitespace-nowrap">
          <Link href="/search" className="hover:text-[#111111] transition-colors">Properties</Link>
          <Link href="/neighbourhoods" className="hover:text-[#111111] transition-colors">Neighbourhoods</Link>
          <Link href="/search" className="hover:text-[#111111] transition-colors">Data</Link>
        </nav>

        {/* View toggle */}
        <ViewToggle />

        {/* Auth */}
        <div className="ml-2 shrink-0">
          {isSignedIn ? (
            <UserButton />
          ) : (
            <SignInButton>
              <button className="bg-[#1C3829] text-white text-xs font-medium px-3.5 py-2 rounded-lg hover:bg-[#2D5A3D] transition-colors">
                Sign In
              </button>
            </SignInButton>
          )}
        </div>
      </header>

      {/* ── Filter Bar (includes SaveSearch at right via FilterPanel) ──── */}
      <div className="shrink-0 z-10">
        <FilterPanel />
      </div>

      {/* ── Main Split Pane ──────────────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden">
        {/* Map pane */}
        {(viewMode === 'map' || viewMode === 'both') && (
          <div
            className="relative overflow-hidden"
            style={{ width: viewMode === 'map' ? '100%' : '58%' }}
          >
            <MapView properties={filteredProperties} />
          </div>
        )}

        {/* List pane */}
        {(viewMode === 'list' || viewMode === 'both') && (
          <div
            className="overflow-hidden border-l border-[#E8E6E1]"
            style={{ width: viewMode === 'list' ? '100%' : '42%' }}
          >
            <ResultsList
              properties={filteredProperties}
              totalCount={filteredProperties.length}
              locationLabel={query || 'All Properties'}
            />
          </div>
        )}
      </div>
    </div>
  )
}
