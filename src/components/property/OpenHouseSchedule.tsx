import { CalendarDays, Clock, Video } from 'lucide-react'
import type { OpenHouseSlot } from '@/lib/api/properties'

interface Props {
  slots: OpenHouseSlot[]
}

/** "14:00:00.00" → "2:00 PM" */
function formatTime(time: string | null): string {
  if (!time) return ''
  const [h, m] = time.split(':')
  const hour = Number(h)
  if (Number.isNaN(hour)) return ''
  const period = hour >= 12 ? 'PM' : 'AM'
  const h12 = hour % 12 === 0 ? 12 : hour % 12
  return `${h12}:${m ?? '00'} ${period}`
}

/** "2027-06-07" → "Sat, Jun 7, 2027" */
function formatDate(date: string | null): string {
  if (!date) return ''
  const d = new Date(date + 'T00:00:00')
  if (Number.isNaN(d.getTime())) return date
  return d.toLocaleDateString('en-CA', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function OpenHouseSchedule({ slots }: Props) {
  if (!slots.length) return null

  return (
    <section className="rounded-2xl border border-[#1C3829]/20 bg-[#F2F5F0] p-5 sm:p-6">
      <div className="flex items-center gap-2 mb-4">
        <CalendarDays size={17} className="text-[#1C3829]" />
        <h2 className="font-heading text-xl font-semibold text-[#111111]">
          Open House{slots.length > 1 ? 's' : ''}
        </h2>
        <span className="ml-1 bg-[#1C3829] text-white text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide">
          {slots.length} upcoming
        </span>
      </div>

      <div className="space-y-2.5">
        {slots.map((oh) => (
          <div
            key={oh.id}
            className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 bg-white rounded-xl border border-[#E8E6E1] px-4 py-3"
          >
            <p className="font-semibold text-sm text-[#111111] sm:w-44 shrink-0">
              {formatDate(oh.date)}
            </p>
            <div className="flex items-center gap-1.5 text-sm text-[#6B6B6B]">
              <Clock size={13} className="text-[#1C3829]" />
              {formatTime(oh.startTime)} – {formatTime(oh.endTime)}
            </div>
            {oh.type && oh.type !== 'Open House' && (
              <span className="text-xs text-[#6B6B6B] italic">{oh.type}</span>
            )}
            {oh.livestreamUrl && (
              <a
                href={oh.livestreamUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="sm:ml-auto inline-flex items-center gap-1.5 text-xs font-semibold text-[#1C3829] hover:underline"
              >
                <Video size={13} />
                Join livestream
              </a>
            )}
          </div>
        ))}
      </div>

      {slots.some((s) => s.remarks) && (
        <p className="text-xs text-[#6B6B6B] mt-3">
          {slots.find((s) => s.remarks)?.remarks}
        </p>
      )}
    </section>
  )
}
