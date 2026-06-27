'use client'

import { useEffect, useState } from 'react'
import { CalendarPlus, Bell, Calendar } from 'lucide-react'
import { getSavedSearches } from '@/lib/api/search'

type Tab = 'All' | 'Alerts' | 'Messages' | 'Schedule'
const TABS: Tab[] = ['All', 'Alerts', 'Messages', 'Schedule']

interface SavedSearch {
  id: string
  name: string | null
  filters: Record<string, unknown>
  createdAt: string
}

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

function MessageItem({
  initials,
  name,
  preview,
  time,
}: {
  initials: string
  name: string
  preview: string
  time: string
}) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-[#E8E6E1] last:border-0">
      <div className="w-8 h-8 rounded-full bg-[#D4E8DC] flex items-center justify-center text-[#1C3829] text-xs font-bold shrink-0">
        {initials}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-0.5">
          <span className="text-xs font-semibold text-[#111111]">{name}</span>
          <span className="text-[10px] text-[#6B6B6B] shrink-0">{time}</span>
        </div>
        <p className="text-xs text-[#6B6B6B] line-clamp-2">{preview}</p>
        <button className="mt-1.5 text-[10px] font-bold text-[#1C3829] uppercase tracking-wide hover:underline">
          ↩ Reply
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
}: {
  icon: React.ReactNode
  title: string
  subtitle: string
  time: string
  badge?: string
}) {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-[#E8E6E1] last:border-0">
      <div className="w-8 h-8 rounded-full bg-[#FEF3C7] flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold text-[#111111]">{title}</span>
          <span className="text-[10px] text-[#6B6B6B] shrink-0">{time}</span>
        </div>
        <p className="text-[11px] text-[#6B6B6B]">{subtitle}</p>
      </div>
      {badge && (
        <span className="text-[9px] font-bold text-white bg-[#1C3829] px-2 py-0.5 rounded-full uppercase tracking-wide shrink-0">
          {badge}
        </span>
      )}
    </div>
  )
}

function SavedSearchAlertItem({ search }: { search: SavedSearch }) {
  const label = search.name ?? [search.filters.city, search.filters.province].filter(Boolean).join(', ') ?? 'Saved Search'
  const since = new Date(search.createdAt).toLocaleDateString('en-CA', { month: 'short', day: 'numeric' })
  return (
    <AlertItem
      icon={<Bell size={14} className="text-amber-600" />}
      title={`New listings: ${label}`}
      subtitle={`Watching since ${since}`}
      time="Active"
      badge="Live"
    />
  )
}

// ─── Main component ────────────────────────────────────────────────────────────

export default function NotificationsPanel() {
  const [activeTab, setActiveTab] = useState<Tab>('All')
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([])

  useEffect(() => {
    getSavedSearches()
      .then((res) => {
        const data = Array.isArray(res.data) ? res.data : []
        setSavedSearches(data.slice(0, 3))
      })
      .catch(() => setSavedSearches([]))
  }, [])

  const totalCount = savedSearches.length

  const showAlerts = activeTab === 'All' || activeTab === 'Alerts'
  const showMessages = activeTab === 'All' || activeTab === 'Messages'
  const showSchedule = activeTab === 'All' || activeTab === 'Schedule'

  return (
    <div className="rounded-2xl border border-[#E8E6E1] bg-white h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-5 pb-3 border-b border-[#E8E6E1]">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-heading text-lg font-semibold text-[#111111]">Notifications</h2>
          {totalCount > 0 && (
            <span className="w-6 h-6 bg-[#1C3829] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {Math.min(totalCount, 9)}
            </span>
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
        {showSchedule && activeTab === 'Schedule' && (
          <p className="text-sm text-[#6B6B6B] py-8 text-center">No upcoming open houses.</p>
        )}

        {/* Alerts — saved search watchers */}
        {showAlerts && (
          <div>
            {savedSearches.map((s) => (
              <SavedSearchAlertItem key={s.id} search={s} />
            ))}
            {savedSearches.length === 0 && activeTab === 'Alerts' && (
              <p className="text-sm text-[#6B6B6B] py-4 text-center">No alerts yet.</p>
            )}
          </div>
        )}

        {/* Messages */}
        {showMessages && activeTab === 'Messages' && (
          <p className="text-sm text-[#6B6B6B] py-8 text-center">No messages yet.</p>
        )}

        {/* Empty state for All tab */}
        {activeTab === 'All' && savedSearches.length === 0 && (
          <p className="text-sm text-[#6B6B6B] py-8 text-center">No notifications yet.</p>
        )}
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-[#E8E6E1] flex items-center justify-between">
        <span className="text-[11px] text-[#6B6B6B]">
          {totalCount} notification{totalCount !== 1 ? 's' : ''}
        </span>
        <button className="text-[11px] font-bold text-[#1C3829] uppercase tracking-widest hover:underline">
          Mark all read →
        </button>
      </div>
    </div>
  )
}
