// Shared "Open House" tag. Single source of truth for how an upcoming open
// house is announced on a listing — the search cards, the map popup, the
// vertical feed, the neighbourhood carousel and the dashboard cards all render
// this exact pill, so the wording and colour never drift between surfaces.
//
// The data behind it is the listing's SOONEST upcoming slot (the API joins the
// DDF OpenHouse resource per listing); the full schedule stays on the detail
// page. Renders nothing when there's no upcoming slot, so every call site can
// drop it in unconditionally.
import { CalendarDays } from 'lucide-react'
import { formatOpenHouseDay, formatOpenHouseTimeRange } from '@/lib/format'
import type { OpenHouseSummary } from '@/types/search'

interface Props {
  openHouse?: OpenHouseSummary | null
  /** `dark` is for tags sitting over imagery (feed, image overlays). */
  theme?: 'light' | 'dark'
  /** Drop the time range and keep just the day — for tight surfaces. */
  compact?: boolean
  className?: string
}

export default function OpenHouseTag({
  openHouse,
  theme = 'light',
  compact = false,
  className = '',
}: Props) {
  const day = formatOpenHouseDay(openHouse?.date)
  if (!openHouse || !day) return null

  const time = compact
    ? ''
    : formatOpenHouseTimeRange(openHouse.startTime, openHouse.endTime)

  const tone =
    theme === 'dark'
      ? 'bg-white/15 text-white backdrop-blur-sm ring-1 ring-white/25'
      : 'bg-[#1C3829]/8 text-[#1C3829] ring-1 ring-[#1C3829]/15'

  return (
    <span
      className={`inline-flex max-w-full items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold leading-tight ${tone} ${className}`.trim()}
    >
      <CalendarDays size={11} className="shrink-0" aria-hidden="true" />
      <span className="truncate">
        Open House {day}
        {time && <span className="font-medium opacity-80"> · {time}</span>}
      </span>
    </span>
  )
}
