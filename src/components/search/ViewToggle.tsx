'use client'

import { useSearchStore } from '@/store/searchStore'
import type { ViewMode } from '@/types/search'

const VIEWS: { id: ViewMode; label: string }[] = [
  // "Feed" = full-width results list; "Map" = the split-pane list+map view.
  { id: 'list', label: 'Feed' },
  { id: 'both', label: 'Map' },
]

export default function ViewToggle() {
  const { viewMode, setViewMode } = useSearchStore()

  return (
    <div className="flex items-center bg-[#F2F0EB] rounded-full p-0.5 gap-0">
      {VIEWS.map((v) => (
        <button
          key={v.id}
          onClick={() => setViewMode(v.id)}
          className={[
            'px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-150',
            viewMode === v.id
              ? 'bg-white text-[#111111] shadow-sm'
              : 'text-[#6B6B6B] hover:text-[#111111]',
          ].join(' ')}
        >
          {v.label}
        </button>
      ))}
    </div>
  )
}
