'use client'

import { useSearchStore } from '@/store/searchStore'
import type { Property } from '@/types/search'
import SearchResultCard from './SearchResultCard'
import CuratorChoiceCard from './CuratorChoiceCard'

interface ResultsListProps {
  properties: Property[]
  totalCount: number
  locationLabel?: string
  isLoading?: boolean
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl overflow-hidden border border-[#E8E6E1] animate-pulse">
      <div className="h-44 bg-[#F2F0EB]" />
      <div className="p-3.5 space-y-2">
        <div className="h-5 bg-[#F2F0EB] rounded w-2/3" />
        <div className="h-3.5 bg-[#F2F0EB] rounded w-1/2" />
        <div className="h-3 bg-[#F2F0EB] rounded w-1/3" />
      </div>
    </div>
  )
}

export default function ResultsList({
  properties,
  totalCount,
  locationLabel = 'Results',
  isLoading = false,
}: ResultsListProps) {
  const curatorChoice = properties.find((p) => p.isCuratorChoice)
  const regularListings = properties.filter((p) => !p.isCuratorChoice)

  return (
    <div className="h-full flex flex-col bg-[#FAF9F6]">
      {/* Header */}
      <div className="px-5 py-4 bg-white border-b border-[#E8E6E1] shrink-0">
        <h2 className="font-heading text-2xl font-semibold text-[#111111] leading-tight">
          {locationLabel}
        </h2>
        <p className="text-xs text-[#6B6B6B] mt-0.5">
          Exclusive curated listings &amp; interior stories.
        </p>
        {!isLoading && (
          <p className="text-[10px] font-semibold text-[#6B6B6B] mt-2 uppercase tracking-widest">
            {totalCount.toLocaleString()} results found
          </p>
        )}
      </div>

      {/* Scrollable list */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
        ) : properties.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {/* Regular listings first */}
            {regularListings.map((p) => (
              <SearchResultCard key={p.id} property={p} />
            ))}

            {/* Curator's Choice section */}
            {curatorChoice && (
              <div>
                <CuratorChoiceCard property={curatorChoice} />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function EmptyState() {
  const { resetFilters } = useSearchStore()
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-12 h-12 bg-[#F2F0EB] rounded-full flex items-center justify-center mb-4">
        <span className="text-2xl">🏡</span>
      </div>
      <h3 className="font-heading text-lg font-semibold text-[#111111] mb-1">No listings found</h3>
      <p className="text-sm text-[#6B6B6B] mb-4 max-w-xs">
        Try adjusting your filters or expanding the map view to see more results.
      </p>
      <button
        onClick={resetFilters}
        className="text-sm text-[#1C3829] font-medium hover:underline"
      >
        Clear all filters
      </button>
    </div>
  )
}
