'use client'

import { useState } from 'react'
import { Bookmark, BookmarkCheck, X, Bell } from 'lucide-react'
import { useSearchStore } from '@/store/searchStore'
import { useUser } from '@clerk/nextjs'

export default function SaveSearch() {
  const { saveSearch, savedSearches, query } = useSearchStore()
  const { isSignedIn } = useUser()
  const [isOpen, setIsOpen] = useState(false)
  const [name, setName] = useState('')
  const [saved, setSaved] = useState(false)

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
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-white border border-[#E8E6E1] text-[#6B6B6B] hover:border-[#1C3829]/40 hover:text-[#111111] transition-colors whitespace-nowrap"
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
          saved
            ? 'bg-[#1C3829] text-white border-[#1C3829]'
            : 'bg-white text-[#111111] border-[#E8E6E1] hover:border-[#1C3829]/40',
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
        <div className="absolute top-full left-0 mt-2 bg-white rounded-xl border border-[#E8E6E1] shadow-xl shadow-black/10 z-50 w-72 p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-[#111111]">Save this search</p>
            <button
              onClick={() => setIsOpen(false)}
              className="text-[#6B6B6B] hover:text-[#111111] transition-colors"
            >
              <X size={14} />
            </button>
          </div>

          <p className="text-xs text-[#6B6B6B] mb-3">
            Get notified when new listings match your criteria.
          </p>

          <input
            type="text"
            placeholder={defaultName}
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            autoFocus
            className="w-full border border-[#E8E6E1] rounded-lg px-3 py-2 text-sm text-[#111111] placeholder:text-[#9B9B9B] focus:outline-none focus:border-[#1C3829] focus:ring-1 focus:ring-[#1C3829]/20 mb-3"
          />

          <div className="flex items-center gap-1.5 mb-4 text-xs text-[#6B6B6B]">
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
            <div className="mt-3 pt-3 border-t border-[#F2F0EB]">
              <p className="text-[10px] font-semibold text-[#6B6B6B] uppercase tracking-wide mb-2">
                Saved Searches ({savedSearches.length})
              </p>
              <div className="space-y-1 max-h-28 overflow-y-auto">
                {savedSearches.map((ss) => (
                  <div key={ss.id} className="flex items-center justify-between py-1">
                    <span className="text-xs text-[#111111] truncate">{ss.name}</span>
                    <button
                      onClick={() => useSearchStore.getState().removeSavedSearch(ss.id)}
                      className="text-[#6B6B6B] hover:text-red-500 transition-colors ml-2 shrink-0"
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
