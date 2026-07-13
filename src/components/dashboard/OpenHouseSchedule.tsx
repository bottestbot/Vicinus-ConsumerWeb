'use client'

// FE-821: My Open House Schedule — day-grouped timeline of scheduled open houses.
import { CalendarClock, MapPin, X } from 'lucide-react'
import {
  useOpenHouseVisits,
  useRemoveOpenHouseVisit,
  useUpdateOpenHouseVisitStatus,
} from '@/hooks/useOpenHouseVisits'
import type { DashboardProperty, OpenHouseVisit, OpenHouseVisitStatus } from '@/types/dashboard'

const STATUS_STYLES: Record<OpenHouseVisitStatus, string> = {
  PLANNED: 'border border-[#E8E6E1] text-[#6B6B6B]',
  ATTENDED: 'bg-[#1C3829] text-white border border-[#1C3829]',
  SKIPPED: 'bg-[#F2F0EB] text-[#9A9790] border border-[#E8E6E1]',
}

function buildAddress(property: DashboardProperty | null): string {
  if (!property) return 'Address not available'
  const street = [property.streetNumber, property.streetName].filter(Boolean).join(' ')
  return [street, property.city].filter(Boolean).join(', ') || 'Address not available'
}

function formatTime(visit: OpenHouseVisit): string {
  if (!visit.openHouseStartTime) return 'Time TBD'
  return visit.openHouseEndTime ? `${visit.openHouseStartTime} – ${visit.openHouseEndTime}` : visit.openHouseStartTime
}

function formatDateHeading(dateKey: string): string {
  if (dateKey === 'unscheduled') return 'Date TBD'
  return new Date(`${dateKey}T00:00:00`).toLocaleDateString('en-CA', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })
}

function VisitRow({ visit }: { visit: OpenHouseVisit }) {
  const updateStatus = useUpdateOpenHouseVisitStatus()
  const remove = useRemoveOpenHouseVisit()
  const address = buildAddress(visit.property)

  return (
    <div className="flex items-center gap-3 py-3 border-b border-[#E8E6E1] last:border-0">
      <div className="w-9 h-9 rounded-full bg-[#F2F0EB] flex items-center justify-center shrink-0">
        <MapPin size={15} className="text-[#1C3829]" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-[#111111] truncate">{address}</p>
        <p className="text-xs text-[#6B6B6B]">{formatTime(visit)}</p>
      </div>
      <select
        value={visit.status}
        onChange={(e) =>
          updateStatus.mutate({ key: visit.ddfOpenHouseKey, status: e.target.value as OpenHouseVisitStatus })
        }
        className={`text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full cursor-pointer ${STATUS_STYLES[visit.status]}`}
      >
        <option value="PLANNED">Planned</option>
        <option value="ATTENDED">Attended</option>
        <option value="SKIPPED">Skipped</option>
      </select>
      <button
        onClick={() => remove.mutate(visit.ddfOpenHouseKey)}
        aria-label="Remove from schedule"
        className="w-7 h-7 rounded-full flex items-center justify-center text-[#6B6B6B] hover:bg-[#F2F0EB] hover:text-[#111111] transition-colors shrink-0"
      >
        <X size={14} />
      </button>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <div className="w-10 h-10 rounded-full bg-[#F2F0EB] flex items-center justify-center mb-3">
        <CalendarClock size={18} className="text-[#6B6B6B]" />
      </div>
      <p className="font-semibold text-[#111111] text-sm mb-1">No open houses scheduled yet</p>
      <p className="text-xs text-[#6B6B6B]">Browse listings and add an open house from a property page.</p>
    </div>
  )
}

export default function OpenHouseSchedule() {
  const { data: groups, isLoading } = useOpenHouseVisits()

  if (isLoading) return null
  const hasVisits = (groups ?? []).some((g) => g.visits.length > 0)

  return (
    <section>
      <div className="mb-5">
        <h2 className="font-heading text-2xl font-semibold text-[#111111] mb-1">My Open House Schedule</h2>
        <p className="text-sm text-[#6B6B6B]">Open houses you&apos;ve added to your calendar.</p>
      </div>

      {!hasVisits ? (
        <div className="rounded-2xl border border-[#E8E6E1] bg-white">
          <EmptyState />
        </div>
      ) : (
        <div className="space-y-6">
          {(groups ?? [])
            .filter((g) => g.visits.length > 0)
            .map((group) => (
              <div key={group.date} className="rounded-2xl border border-[#E8E6E1] bg-white px-5">
                <p className="text-[11px] font-bold text-[#1C3829] uppercase tracking-widest pt-4 pb-1">
                  {formatDateHeading(group.date)}
                </p>
                {group.visits.map((visit) => (
                  <VisitRow key={visit.id} visit={visit} />
                ))}
              </div>
            ))}
        </div>
      )}
    </section>
  )
}
