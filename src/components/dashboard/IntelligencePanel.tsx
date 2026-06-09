'use client'

import { useState } from 'react'
import { CalendarPlus, TrendingDown } from 'lucide-react'
import Link from 'next/link'

type Tab = 'All' | 'Messages' | 'Alerts' | 'Schedule'

const TABS: Tab[] = ['All', 'Messages', 'Alerts', 'Schedule']

function OpenHouseItem() {
  return (
    <div className="rounded-xl border border-[#E8E6E1] overflow-hidden">
      <div className="bg-[#1C3829]/10 px-4 py-2 flex items-center justify-between">
        <span className="text-[10px] font-bold text-[#1C3829] uppercase tracking-widest">
          Upcoming Open House
        </span>
        <span className="text-[9px] font-bold text-white bg-[#1C3829] px-2 py-0.5 rounded-full uppercase tracking-wide">
          New
        </span>
      </div>
      <div className="p-3.5">
        <p className="font-heading text-sm font-semibold text-[#111111] mb-0.5">
          The Glass Pavilion, Rosedale
        </p>
        <p className="text-xs text-[#6B6B6B] mb-3">📅 Saturday, Oct 12 · 🕑 2:00 PM – 4:30 PM</p>
        <button className="flex items-center gap-1.5 bg-[#1C3829] text-white text-[11px] font-bold px-3 py-1.5 rounded-lg uppercase tracking-wide hover:bg-[#2D5A3D] transition-colors">
          <CalendarPlus size={11} />
          Add to Calendar
        </button>
      </div>
    </div>
  )
}

function RealtorMessageItem() {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-[#E8E6E1]">
      <div className="w-8 h-8 rounded-full bg-[#D4E8DC] flex items-center justify-center text-[#1C3829] text-xs font-bold shrink-0">
        SR
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-0.5">
          <span className="text-xs font-semibold text-[#111111]">Sarah (Realtor)</span>
          <span className="text-[10px] text-[#6B6B6B] shrink-0">2h ago</span>
        </div>
        <p className="text-xs text-[#6B6B6B] line-clamp-2">
          Just wanted to follow up on the Rosedale property — would love to schedule a showing this week if you&apos;re interested!
        </p>
        <button className="mt-1.5 text-[10px] font-bold text-[#1C3829] uppercase tracking-wide hover:underline">
          ↩ Reply
        </button>
      </div>
    </div>
  )
}

function PriceDropItem() {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-[#E8E6E1]">
      <div className="w-8 h-8 rounded-full bg-[#FEF3C7] flex items-center justify-center shrink-0">
        <TrendingDown size={14} className="text-amber-600" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold text-[#111111]">Price Drop: Tribeca Loft</span>
          <span className="text-[10px] text-[#6B6B6B] shrink-0">5h ago</span>
        </div>
        <p className="text-[11px] text-[#6B6B6B]">–$250,000 · Now $4.75M</p>
      </div>
    </div>
  )
}

export default function IntelligencePanel() {
  const [activeTab, setActiveTab] = useState<Tab>('All')

  return (
    <div className="rounded-2xl border border-[#E8E6E1] bg-white h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-5 pb-3 border-b border-[#E8E6E1]">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-heading text-lg font-semibold text-[#111111]">Intelligence</h2>
          <span className="w-6 h-6 bg-[#1C3829] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            5
          </span>
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
        <OpenHouseItem />
        <RealtorMessageItem />
        <PriceDropItem />
      </div>

      {/* Footer link */}
      <div className="px-5 py-3 border-t border-[#E8E6E1]">
        <Link
          href="/dashboard#intelligence"
          className="text-[11px] font-bold text-[#1C3829] uppercase tracking-widest hover:underline"
        >
          View All Intelligence →
        </Link>
      </div>
    </div>
  )
}
