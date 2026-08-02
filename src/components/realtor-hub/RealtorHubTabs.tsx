'use client'

import { useState } from 'react'
import Image from 'next/image'
import { TrendingUp } from 'lucide-react'

// Real product screenshots per tab. `image: null` falls back to the built-in
// stats mock — Leads has no capture yet.
const TABS = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    image: '/realtor-hub/dashboard.png',
    alt: 'REALTOR® Hub dashboard showing market pulse and activity',
    heading: 'Here’s your market pulse for Q2',
    stats: [
      { label: 'Active Leads', value: '42' },
      { label: 'Saved Searches', value: '318' },
      { label: 'Profile Views', value: '5,240' },
      { label: 'Response Rate', value: '96%' },
    ],
  },
  {
    key: 'listings',
    label: 'Listings',
    image: '/realtor-hub/listings.png',
    alt: 'Listings management view showing the agent’s active inventory',
    heading: 'Your active inventory',
    stats: [
      { label: 'Live Listings', value: '23' },
      { label: 'Total Views', value: '18.4K' },
      { label: 'Saved by Buyers', value: '612' },
      { label: 'Avg. Days Live', value: '11' },
    ],
  },
  {
    key: 'leads',
    label: 'Leads',
    image: '/realtor-hub/leads.png',
    alt: 'Leads view showing new buyer intent and lead activity',
    heading: 'New buyer intent this week',
    stats: [
      { label: 'New Leads', value: '86' },
      { label: 'Hot Leads', value: '14' },
      { label: 'Avg. Response', value: '4m' },
      { label: 'Converted', value: '9' },
    ],
  },
  {
    key: 'clients',
    label: 'Clients',
    image: '/realtor-hub/clients.png',
    alt: 'Client detail view with Vicinus IQ intent score, search parameters, and showings',
    heading: 'Know every client’s intent',
    stats: [
      { label: 'Active Clients', value: '38' },
      { label: 'High Intent', value: '11' },
      { label: 'Showings Booked', value: '24' },
      { label: 'Avg. Close Prob.', value: '68%' },
    ],
  },
  {
    key: 'amplify',
    label: 'Amplify',
    image: '/realtor-hub/amplify.png',
    alt: 'Amplify view showing listing reach and promotion performance',
    heading: 'Reach beyond your network',
    stats: [
      { label: 'Boosted Listings', value: '6' },
      { label: 'Impressions', value: '64.2K' },
      { label: 'Shares', value: '412' },
      { label: 'New Followers', value: '128' },
    ],
  },
  {
    key: 'analytics',
    label: 'Analytics',
    image: '/realtor-hub/analytics.png',
    alt: 'Analytics view showing buyer views, enquiries, and engagement over time',
    heading: 'Know exactly what’s working',
    stats: [
      { label: 'Buyer Views', value: '45.6K' },
      { label: 'Enquiries', value: '3,140' },
      { label: 'Showings', value: '296' },
      { label: 'Avg. Days on Market', value: '31,840' },
    ],
  },
]

type Tab = (typeof TABS)[number]

// Fallback for any tab without a screenshot yet.
function StatsPreview({ tab }: { tab: Tab }) {
  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/5">
      <div className="flex items-center gap-1.5 border-b border-[#E8E6E1] bg-[#F2F0EB] px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-[#E36A5B]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#E8B84B]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#7FBF7F]" />
        <span className="ml-3 h-4 flex-1 rounded bg-white/70" />
      </div>

      <div className="p-5">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-[#6B6B6B]">
          {tab.label}
        </p>
        <p className="mb-4 text-sm font-semibold text-[#111111]">{tab.heading}</p>

        <div className="mb-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {tab.stats.map((s) => (
            <div key={s.label} className="rounded-lg border border-[#E8E6E1] bg-[#FAF9F6] p-3">
              <p className="text-[9px] uppercase tracking-wide text-[#6B6B6B]">{s.label}</p>
              <p className="mt-1 text-base font-bold text-[#111111]">{s.value}</p>
            </div>
          ))}
        </div>

        <div className="rounded-lg border border-[#E8E6E1] bg-[#1C2C1A] p-4">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[#A3E635]/80">
              Engagement over time
            </p>
            <span className="flex items-center gap-1 text-[10px] font-semibold text-[#A3E635]">
              <TrendingUp size={12} /> +18%
            </span>
          </div>
          <div className="flex h-16 items-end gap-1.5">
            {[30, 45, 38, 60, 52, 70, 64, 80, 74, 90, 85, 96].map((v, i) => (
              <span
                key={i}
                className="flex-1 rounded-t-sm bg-[#A3E635]"
                style={{ height: `${v}%`, opacity: 0.35 + (v / 100) * 0.65 }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function RealtorHubTabs() {
  const [active, setActive] = useState(TABS[0].key)
  const activeTab = TABS.find((t) => t.key === active) ?? TABS[0]

  return (
    <section className="bg-[#16241A] px-6 py-20 lg:py-24">
      <div className="mx-auto max-w-5xl text-center">
        <h2 className="font-heading text-3xl font-bold text-white sm:text-4xl">
          The Complete REALTOR<sup className="text-base">&reg;</sup> Hub
        </h2>

        <nav className="mt-8 flex flex-wrap items-center justify-center gap-6 border-b border-white/10 pb-4 text-sm">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setActive(t.key)}
              aria-pressed={active === t.key}
              className={[
                'font-semibold capitalize transition-colors',
                active === t.key ? 'text-[#A3E635]' : 'text-white/50 hover:text-white/80',
              ].join(' ')}
            >
              {t.label}
            </button>
          ))}
        </nav>

        <div className="mt-10 text-left">
          {activeTab.image ? (
            // object-contain, not cover: the screenshots are ~1.72 wide while
            // Clients is ~1.31, so cover cropped the edges off — cutting the
            // left column of labels clean off ("...y Listings"). The fixed
            // aspect keeps every tab the same height so switching doesn't
            // shift the page; the white letterbox is invisible against the
            // screenshots' own white chrome.
            <div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/5">
              <Image
                key={activeTab.key}
                src={activeTab.image}
                alt={activeTab.alt}
                fill
                sizes="(min-width: 1024px) 64rem, 100vw"
                className="object-contain"
              />
            </div>
          ) : (
            <StatsPreview tab={activeTab} />
          )}
        </div>

        <a
          href="#claim-access"
          className="mt-10 inline-flex items-center gap-2 rounded-xl bg-[#A3E635] px-6 py-3.5 text-sm font-bold text-[#111111] transition-colors hover:bg-[#95D62F]"
        >
          Claim Your Founding Access
        </a>

        <div className="mt-6 flex items-center justify-center gap-2">
          {TABS.map((t) => (
            <span
              key={t.key}
              className={[
                'h-1.5 rounded-full transition-all',
                active === t.key ? 'w-5 bg-[#A3E635]' : 'w-1.5 bg-white/20',
              ].join(' ')}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
