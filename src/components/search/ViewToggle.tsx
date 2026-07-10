'use client'

import { useSearchStore } from '@/store/searchStore'
import type { ViewMode } from '@/types/search'
import { glass, type GlassTheme } from './glassTheme'

const VIEWS: { id: ViewMode; label: string }[] = [
  // "Feed" = full-width results list; "Map" = the split-pane list+map view.
  { id: 'list', label: 'Feed' },
  { id: 'both', label: 'Map' },
]

export default function ViewToggle({ theme = 'dark' }: { theme?: GlassTheme }) {
  const { viewMode, setViewMode } = useSearchStore()
  const t = glass(theme)

  return (
    <div className={`flex items-center rounded-full p-0.5 gap-0 ${t.toggleTrack}`}>
      {VIEWS.map((v) => (
        <button
          key={v.id}
          onClick={() => setViewMode(v.id)}
          className={[
            'px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-150',
            viewMode === v.id
              ? 'bg-white text-[#111111] shadow-sm'
              : t.toggleIdle,
          ].join(' ')}
        >
          {v.label}
        </button>
      ))}
    </div>
  )
}
