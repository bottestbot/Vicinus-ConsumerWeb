'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CalendarPlus, Calendar, ArrowDown, RefreshCw, Home } from 'lucide-react'
import { useAlerts, useDeleteAlert, useMarkAllAlertsRead, ALERTS_PAGE_SIZE } from '@/hooks/useAlerts'
import { useOpenHouseVisits } from '@/hooks/useOpenHouseVisits'
import { formatOpenHouseTime, formatOpenHouseTimeRange } from '@/lib/format'
import AddToScheduleButton from '@/components/property/AddToScheduleButton'
import type { Alert, AlertType, DashboardProperty, OpenHouseVisit } from '@/types/dashboard'

type Tab = 'All' | 'Alerts' | 'Schedule'
const TABS: Tab[] = ['All', 'Alerts', 'Schedule']

// ─── Item components ───────────────────────────────────────────────────────────

function OpenHouseItem({ address, date, time }: { address: string; date: string; time: string }) {
  return (
    <div className="rounded-xl border border-[#E8E6E1] overflow-hidden">
      <div className="bg-[#1C3829]/10 px-4 py-2 flex items-center justify-between">
        <span className="text-[10px] font-bold text-[#1C3829] uppercase tracking-widest">
          Upcoming Open House
        </span>
        <Calendar size={12} className="text-[#1C3829]" />
      </div>
      <div className="p-3.5">
        <p className="font-heading text-sm font-semibold text-[#111111] mb-0.5">{address}</p>
        <p className="text-xs text-[#6B6B6B] mb-3">📅 {date} · 🕑 {time}</p>
        <button className="flex items-center gap-1.5 bg-[#1C3829] text-white text-[11px] font-bold px-3 py-1.5 rounded-lg uppercase tracking-wide hover:bg-[#2D5A3D] transition-colors">
          <CalendarPlus size={11} />
          Add to Calendar
        </button>
      </div>
    </div>
  )
}

function AlertItem({
  icon,
  title,
  subtitle,
  time,
  badge,
  onClick,
  action,
  stripeColor,
  iconBg,
}: {
  icon: React.ReactNode
  title: string
  subtitle: string
  time: string
  badge?: string
  onClick?: () => void
  action?: React.ReactNode
  stripeColor: string
  iconBg: string
}) {
  return (
    <div
      onClick={onClick}
      className={`flex gap-3 py-3 border-b border-[#E8E6E1] last:border-0 ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className="w-[3px] rounded-full shrink-0 self-stretch" style={{ backgroundColor: stripeColor }} />
      <div className="w-[30px] h-[30px] rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: iconBg }}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold text-[#111111]">{title}</span>
          <span className="text-[10px] text-[#6B6B6B] shrink-0 tabular-nums">{time}</span>
        </div>
        <p className="text-[11px] text-[#6B6B6B]">{subtitle}</p>
        {action && <div className="mt-2">{action}</div>}
      </div>
      {badge && (
        <span className="text-[9px] font-bold text-white bg-[#1C3829] px-2 py-0.5 rounded-full uppercase tracking-wide shrink-0 h-fit">
          {badge}
        </span>
      )}
    </div>
  )
}

// ─── Alert type → visual mapping ───────────────────────────────────────────────
// Muted tones from Vicinus's own palette rather than a generic red/green/blue
// alert system — forest green stays the one true brand accent (open house,
// matching the "Add to schedule" CTA elsewhere); new listing / price drop /
// status change each get a related-but-distinct tone from the same family.
const ALERT_COLORS = {
  sage: { stripe: '#7C9473', iconBg: '#EEF2EA', iconText: '#47603F' }, // NEW_LISTING
  rust: { stripe: '#B9603A', iconBg: '#F8ECE5', iconText: '#8A3F22' }, // PRICE_DROP
  ochre: { stripe: '#A67C2E', iconBg: '#F7EFD9', iconText: '#7C5B1C' }, // STATUS_CHANGE
  forest: { stripe: '#1C3829', iconBg: '#E6EDE8', iconText: '#1C3829' }, // OPEN_HOUSE
} as const

function formatTime(createdAt: string): string {
  const d = new Date(createdAt)
  const diffMin = Math.floor((Date.now() - d.getTime()) / 60_000)
  if (diffMin < 1) return 'Just now'
  if (diffMin < 60) return `${diffMin}m`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h`
  return d.toLocaleDateString('en-CA', { month: 'short', day: 'numeric' })
}

/** Day-group header label — "Today" / "Yesterday" / "Jul 10". */
function dayLabel(createdAt: string): string {
  const d = new Date(createdAt)
  const startOf = (dt: Date) => new Date(dt.getFullYear(), dt.getMonth(), dt.getDate()).getTime()
  const diffDays = Math.round((startOf(new Date()) - startOf(d)) / 86_400_000)
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  return d.toLocaleDateString('en-CA', { month: 'short', day: 'numeric' })
}

/** Groups a createdAt-sorted-desc list into consecutive same-day buckets. */
function groupByDay<T extends { createdAt: string }>(items: T[]): { label: string; items: T[] }[] {
  const groups: { label: string; items: T[] }[] = []
  for (const item of items) {
    const label = dayLabel(item.createdAt)
    const last = groups[groups.length - 1]
    if (last && last.label === label) last.items.push(item)
    else groups.push({ label, items: [item] })
  }
  return groups
}

/** DDF addresses often come through in ALL CAPS — title-case for display. */
function toTitleCase(value: string): string {
  return value.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())
}

function addressLabel(payload: Record<string, unknown>, property: DashboardProperty | null): string {
  if (typeof payload.address === 'string' && payload.address) return toTitleCase(payload.address)
  if (property) {
    const addr = [property.streetNumber, property.streetName].filter(Boolean).join(' ') || property.city
    return addr ? toTitleCase(addr) : 'A listing'
  }
  return 'A listing'
}

/** "2026-07-19T00:00:00.000Z" → "Jul 19" */
function formatOpenHouseDate(dateStr: string | undefined): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return dateStr
  return d.toLocaleDateString('en-CA', { month: 'short', day: 'numeric' })
}

function alertVisual(alert: Alert): {
  icon: React.ReactNode
  title: string
  subtitle: string
  stripeColor: string
  iconBg: string
} {
  const address = addressLabel(alert.payload, alert.property)
  switch (alert.type) {
    case 'NEW_LISTING': {
      const c = ALERT_COLORS.sage
      return {
        icon: <Home size={14} style={{ color: c.iconText }} />,
        title: `New listing: ${address}`,
        subtitle: 'Matches your saved search',
        stripeColor: c.stripe,
        iconBg: c.iconBg,
      }
    }
    case 'PRICE_DROP': {
      const c = ALERT_COLORS.rust
      const prev = alert.payload.previousPrice as number | undefined
      const next = alert.payload.newPrice as number | undefined
      return {
        icon: <ArrowDown size={14} style={{ color: c.iconText }} />,
        title: `Price drop: ${address}`,
        subtitle: prev != null && next != null ? `$${prev.toLocaleString()} → $${next.toLocaleString()}` : 'Price reduced',
        stripeColor: c.stripe,
        iconBg: c.iconBg,
      }
    }
    case 'STATUS_CHANGE': {
      const c = ALERT_COLORS.ochre
      const prev = alert.payload.previousStatus as string | undefined
      const next = alert.payload.newStatus as string | undefined
      return {
        icon: <RefreshCw size={13} style={{ color: c.iconText }} />,
        title: `Status changed: ${address}`,
        subtitle: prev && next ? `${prev} → ${next}` : 'Listing status updated',
        stripeColor: c.stripe,
        iconBg: c.iconBg,
      }
    }
    case 'OPEN_HOUSE': {
      const c = ALERT_COLORS.forest
      const date = formatOpenHouseDate(alert.payload.openHouseDate as string | undefined)
      const start = formatOpenHouseTime(alert.payload.startTime as string | undefined)
      const end = formatOpenHouseTime(alert.payload.endTime as string | undefined)
      return {
        icon: <Calendar size={14} style={{ color: c.iconText }} />,
        title: `Open house: ${address}`,
        subtitle: date ? `${date}${start ? ` · ${start}${end ? `–${end}` : ''}` : ''}` : 'New open house scheduled',
        stripeColor: c.stripe,
        iconBg: c.iconBg,
      }
    }
  }
}

function buildScheduleAddress(property: DashboardProperty | null): string {
  if (!property) return 'Address not available'
  return [property.streetNumber, property.streetName].filter(Boolean).join(' ') || property.city || 'Address not available'
}

function formatScheduleDate(dateStr: string | null): string {
  if (!dateStr) return 'Date TBD'
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString('en-CA', { month: 'short', day: 'numeric' })
}

function formatScheduleTime(visit: OpenHouseVisit): string {
  if (!visit.openHouseStartTime) return 'Time TBD'
  return formatOpenHouseTimeRange(visit.openHouseStartTime, visit.openHouseEndTime)
}

/** Every alert type except OPEN_HOUSE — the "Alerts" tab's own server-side
 *  filter, fetched via a dedicated query rather than sliced from "All"'s
 *  paginated window (that window can be dominated by OPEN_HOUSE rows). */
const NON_OPEN_HOUSE_TYPES: AlertType[] = ['NEW_LISTING', 'PRICE_DROP', 'STATUS_CHANGE']

/** Numbered page controls — 1, 2, 3, 4… rather than "Load more". */
function Pagination({
  page,
  totalPages,
  onChange,
}: {
  page: number
  totalPages: number
  onChange: (page: number) => void
}) {
  if (totalPages <= 1) return null
  return (
    <div className="flex items-center justify-center gap-1 pt-3">
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
        <button
          key={p}
          onClick={() => onChange(p)}
          aria-current={p === page ? 'page' : undefined}
          className={`w-7 h-7 shrink-0 rounded-full text-[11px] font-semibold transition-colors ${
            p === page ? 'bg-[#1C3829] text-white' : 'text-[#6B6B6B] hover:bg-[#F2F0EB]'
          }`}
        >
          {p}
        </button>
      ))}
    </div>
  )
}

// ─── Day-grouped alert list — shared by the "All" and "Alerts" tabs, each of
// which is backed by its own useAlerts() query/pagination state ──────────────

function AlertsList({
  alerts,
  emptyMessage,
  isFetching,
  page,
  totalPages,
  onPageChange,
  onOpenAlert,
}: {
  alerts: Alert[]
  emptyMessage: string
  isFetching: boolean
  page: number
  totalPages: number
  onPageChange: (page: number) => void
  onOpenAlert: (alert: Alert) => void
}) {
  return (
    <div className={isFetching ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
      {groupByDay(alerts).map((group) => (
        <div key={group.label}>
          <p className="text-[10.5px] font-bold text-[#6B6B6B] uppercase tracking-widest mt-4 mb-2 first:mt-0">
            {group.label}
          </p>
          {group.items.map((alert) => {
            const visual = alertVisual(alert)
            const propertyId = alert.property?.id ?? alert.propertyId
            return (
              <AlertItem
                key={alert.id}
                icon={visual.icon}
                title={visual.title}
                subtitle={visual.subtitle}
                stripeColor={visual.stripeColor}
                iconBg={visual.iconBg}
                time={formatTime(alert.createdAt)}
                badge={!alert.readAt ? 'New' : undefined}
                onClick={propertyId ? () => onOpenAlert(alert) : undefined}
                action={
                  alert.type === 'OPEN_HOUSE' && alert.ddfOpenHouseKey ? (
                    <AddToScheduleButton
                      openHouseKey={alert.ddfOpenHouseKey}
                      currentListingId={alert.property?.id ?? ''}
                      className="shrink-0 text-[9px] px-2 py-1"
                    />
                  ) : undefined
                }
              />
            )
          })}
        </div>
      ))}
      {alerts.length === 0 && <p className="text-sm text-[#6B6B6B] py-8 text-center">{emptyMessage}</p>}
      <Pagination page={page} totalPages={totalPages} onChange={onPageChange} />
    </div>
  )
}

// ─── Main component ────────────────────────────────────────────────────────────

export default function NotificationsPanel() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<Tab>('All')
  const [allPage, setAllPage] = useState(1)
  const [alertsPage, setAlertsPage] = useState(1)
  const all = useAlerts(allPage)
  const alertsOnly = useAlerts(alertsPage, NON_OPEN_HOUSE_TYPES)
  const { data: scheduleGroups } = useOpenHouseVisits()
  const deleteAlert = useDeleteAlert()
  const markAllRead = useMarkAllAlertsRead()

  const alerts = all.data?.alerts ?? []
  const alertsForAlertsTab = alertsOnly.data?.alerts ?? []
  const allTotalPages = Math.ceil((all.data?.total ?? 0) / ALERTS_PAGE_SIZE)
  const alertsTotalPages = Math.ceil((alertsOnly.data?.total ?? 0) / ALERTS_PAGE_SIZE)
  // The unread badge/footer count is global (repeated on every cached page of
  // every tab's response) — "All" is as good a source as any.
  const unreadCount = all.data?.unreadCount ?? 0
  const scheduleVisits = (scheduleGroups ?? []).flatMap((g) => g.visits)

  const openAlert = (alert: Alert) => {
    const propertyId = alert.property?.id ?? alert.propertyId
    if (!propertyId) return
    deleteAlert.mutate(alert.id)
    router.push(`/properties/${propertyId}`)
  }

  const showSchedule = activeTab === 'Schedule'

  return (
    <div className="rounded-2xl border border-[#E8E6E1] bg-white h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-5 pb-3 border-b border-[#E8E6E1]">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-heading text-lg font-semibold text-[#111111]">Notifications</h2>
          {unreadCount > 0 && (
            <span
              className="w-2.5 h-2.5 rounded-full bg-[#1C3829]"
              role="status"
              aria-label={`${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`}
            />
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 overflow-x-auto scrollbar-none">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-[11px] font-semibold transition-colors ${
                activeTab === tab
                  ? 'bg-[#111111] text-white'
                  : 'text-[#6B6B6B] hover:text-[#111111]'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Items */}
      <div className="flex-1 overflow-y-auto px-5 pt-4 pb-2 space-y-3">

        {/* Schedule */}
        {showSchedule && (
          <div>
            {scheduleVisits.map((v) => (
              <OpenHouseItem
                key={v.id}
                address={buildScheduleAddress(v.property)}
                date={formatScheduleDate(v.openHouseDate)}
                time={formatScheduleTime(v)}
              />
            ))}
            {scheduleVisits.length === 0 && (
              <p className="text-sm text-[#6B6B6B] py-8 text-center">No upcoming open houses.</p>
            )}
          </div>
        )}

        {/* Alerts — grouped by day so the full-height panel isn't just a flat list.
            "All" and "Alerts" are independent queries/pagination, not a
            client-side filter of one shared fetch. */}
        {activeTab === 'All' && (
          <AlertsList
            alerts={alerts}
            emptyMessage="No notifications yet."
            isFetching={all.isFetching}
            page={allPage}
            totalPages={allTotalPages}
            onPageChange={setAllPage}
            onOpenAlert={openAlert}
          />
        )}
        {activeTab === 'Alerts' && (
          <AlertsList
            alerts={alertsForAlertsTab}
            emptyMessage="No alerts yet."
            isFetching={alertsOnly.isFetching}
            page={alertsPage}
            totalPages={alertsTotalPages}
            onPageChange={setAlertsPage}
            onOpenAlert={openAlert}
          />
        )}
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-[#E8E6E1] flex items-center justify-between">
        <span className="text-[11px] text-[#6B6B6B]">
          {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
        </span>
        <button
          onClick={() => markAllRead.mutate()}
          disabled={markAllRead.isPending || unreadCount === 0}
          className="text-[11px] font-bold text-[#1C3829] uppercase tracking-widest hover:underline disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Mark all read →
        </button>
      </div>
    </div>
  )
}
