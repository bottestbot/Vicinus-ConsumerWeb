'use client'

import { useEffect, useRef } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useSearchStore } from '@/store/searchStore'
import type { Property } from '@/types/search'
import SearchResultCard from './SearchResultCard'
import CuratorChoiceCard from './CuratorChoiceCard'

interface ResultsListProps {
  properties: Property[]
  totalCount: number
  locationLabel?: string
  isLoading?: boolean
  page?: number
  totalPages?: number
  onPageChange?: (page: number) => void
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

/** Build a compact page list with ellipses, e.g. [1, '…', 4, 5, 6, '…', 20]. */
function getPageItems(current: number, total: number): (number | '…')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const items: (number | '…')[] = [1]
  const start = Math.max(2, current - 1)
  const end = Math.min(total - 1, current + 1)
  if (start > 2) items.push('…')
  for (let i = start; i <= end; i++) items.push(i)
  if (end < total - 1) items.push('…')
  items.push(total)
  return items
}

function Pagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number
  totalPages: number
  onPageChange: (p: number) => void
}) {
  if (totalPages <= 1) return null
  const items = getPageItems(page, totalPages)

  return (
    <nav className="flex items-center justify-center gap-1 py-4" aria-label="Pagination">
      <button
        onClick={() => onPageChange(Math.max(1, page - 1))}
        disabled={page === 1}
        aria-label="Previous page"
        className="w-8 h-8 rounded-full border border-[#E8E6E1] flex items-center justify-center text-[#6B6B6B] hover:border-[#1C3829] hover:text-[#1C3829] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronLeft size={15} />
      </button>

      {items.map((it, i) =>
        it === '…' ? (
          <span key={`gap-${i}`} className="w-8 h-8 flex items-center justify-center text-[#9B9B9B] text-sm">
            …
          </span>
        ) : (
          <button
            key={it}
            onClick={() => onPageChange(it)}
            aria-current={it === page ? 'page' : undefined}
            className={[
              'min-w-8 h-8 px-2 rounded-full text-sm font-medium transition-colors',
              it === page
                ? 'bg-[#1C3829] text-white'
                : 'text-[#111111] hover:bg-white border border-transparent hover:border-[#E8E6E1]',
            ].join(' ')}
          >
            {it}
          </button>
        ),
      )}

      <button
        onClick={() => onPageChange(Math.min(totalPages, page + 1))}
        disabled={page === totalPages}
        aria-label="Next page"
        className="w-8 h-8 rounded-full border border-[#E8E6E1] flex items-center justify-center text-[#6B6B6B] hover:border-[#1C3829] hover:text-[#1C3829] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronRight size={15} />
      </button>
    </nav>
  )
}

export default function ResultsList({
  properties,
  totalCount,
  locationLabel = 'Results',
  isLoading = false,
  page = 1,
  totalPages = 1,
  onPageChange,
}: ResultsListProps) {
  const curatorChoice = properties.find((p) => p.isCuratorChoice)
  const regularListings = properties.filter((p) => !p.isCuratorChoice)

  // Scroll the list back to the top whenever the page changes.
  const scrollRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 })
  }, [page])

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
            {totalPages > 1 && ` · page ${page} of ${totalPages.toLocaleString()}`}
          </p>
        )}
      </div>

      {/* Scrollable list */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
        ) : properties.length === 0 ? (
          <EmptyState locationLabel={locationLabel} />
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

            {onPageChange && (
              <Pagination page={page} totalPages={totalPages} onPageChange={onPageChange} />
            )}
          </>
        )}
      </div>
    </div>
  )
}

function EmptyState({ locationLabel }: { locationLabel: string }) {
  const { resetFilters } = useSearchStore()
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-12 h-12 bg-[#F2F0EB] rounded-full flex items-center justify-center mb-4">
        <span className="text-2xl">🏡</span>
      </div>
      <h3 className="font-heading text-lg font-semibold text-[#111111] mb-1">No properties found</h3>
      <p className="text-sm text-[#6B6B6B] mb-4 max-w-xs">
        No properties found in <span className="font-medium text-[#111111]">{locationLabel}</span> — try a different city or adjust your filters.
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
