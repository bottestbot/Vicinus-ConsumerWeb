const RECENT_SEARCHES = [
  { id: 'rs1', emoji: '🔍', label: 'Modern Lofts in Chelsea' },
  { id: 'rs2', emoji: '🌿', label: 'Sustainable Homes in Aspen' },
  { id: 'rs3', emoji: '💧', label: 'Waterfront Malibu' },
  { id: 'rs4', emoji: '🏛', label: 'Brutalist Structures' },
  { id: 'rs5', emoji: '🏔', label: 'Mountain Retreats Whistler' },
]

export default function RecentSearches() {
  return (
    <div className="mt-5">
      <p className="text-[11px] font-semibold text-[#6B6B6B] uppercase tracking-widest mb-3">
        Recent Searches
      </p>
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {RECENT_SEARCHES.map((search) => (
          <button
            key={search.id}
            className="shrink-0 flex items-center gap-2 px-3.5 py-2 rounded-full border border-[#E8E6E1] bg-white text-sm text-[#111111] hover:border-[#1C3829]/40 hover:bg-[#F2F0EB] transition-colors whitespace-nowrap"
          >
            <span>{search.emoji}</span>
            <span className="font-medium text-[13px]">{search.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
