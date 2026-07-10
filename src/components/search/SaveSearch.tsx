'use client'

import { useState } from 'react'
import { Bookmark, BookmarkCheck, X, Bell } from 'lucide-react'
import { useSearchStore } from '@/store/searchStore'
import { useUser } from '@clerk/nextjs'
import { glass, PILL_ACTIVE, type GlassTheme } from './glassTheme'

export default function SaveSearch({ theme = 'dark' }: { theme?: GlassTheme }) {
  const { saveSearch, savedSearches, query } = useSearchStore()
  const { isSignedIn } = useUser()
  const [isOpen, setIsOpen] = useState(false)
  const [name, setName] = useState('')
  const [saved, setSaved] = useState(false)
  const t = glass(theme)

  const handleSave = () => {
    if (!name.trim()) return
    saveSearch(name.trim())
    setSaved(true)
    setIsOpen(false)
    setName('')
    setTimeout(() => setSaved(false), 3000)
  }

  const defaultName = query
    ? `${query} search`
    : 'My saved search'

  if (!isSignedIn) {
    return (
      <a
        href="/sign-in"
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors whitespace-nowrap ${t.chipIdle}`}
      >
        <Bookmark size={12} />
        Save Search
      </a>
    )
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen((v) => !v)}
        className={[
          'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium',
          'border whitespace-nowrap transition-colors',
          saved ? PILL_ACTIVE : t.chipIdle,
        ].join(' ')}
      >
        {saved ? (
          <>
            <BookmarkCheck size={12} />
            Saved!
          </>
        ) : (
          <>
            <Bookmark size={12} />
            Save Search
          </>
        )}
      </button>

      {/* Save dialog */}
      {isOpen && (
        <div className={`absolute top-full left-0 mt-2 rounded-xl z-50 w-72 p-4 ${t.surface} ${t.text}`}>
          <div className="flex items-center justify-between mb-3">
            <p className={`text-sm font-semibold ${t.text}`}>Save this search</p>
            <button
              onClick={() => setIsOpen(false)}
              className={`transition-colors ${t.icon} ${t.iconHover}`}
            >
              <X size={14} />
            </button>
          </div>

          <p className={`text-xs mb-3 ${t.textMuted}`}>
            Get notified when new listings match your criteria.
          </p>

          <input
            type="text"
            placeholder={defaultName}
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            autoFocus
            className={`w-full rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none ${t.input}`}
          />

          <div className={`flex items-center gap-1.5 mb-4 text-xs ${t.textMuted}`}>
            <Bell size={11} />
            <span>Email alerts for new matches</span>
          </div>

          <button
            onClick={handleSave}
            disabled={!name.trim()}
            className="w-full py-2 bg-[#1C3829] text-white rounded-lg text-sm font-medium hover:bg-[#2D5A3D] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Save Search
          </button>

          {/* Existing saved searches */}
          {savedSearches.length > 0 && (
            <div className={`mt-3 pt-3 border-t ${t.borderSoft}`}>
              <p className={`text-[10px] font-semibold uppercase tracking-wide mb-2 ${t.textFaint}`}>
                Saved Searches ({savedSearches.length})
              </p>
              <div className="space-y-1 max-h-28 overflow-y-auto">
                {savedSearches.map((ss) => (
                  <div key={ss.id} className="flex items-center justify-between py-1">
                    <span className={`text-xs truncate ${t.text}`}>{ss.name}</span>
                    <button
                      onClick={() => useSearchStore.getState().removeSavedSearch(ss.id)}
                      className={`transition-colors ml-2 shrink-0 ${t.icon} hover:text-red-400`}
                    >
                      <X size={11} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
