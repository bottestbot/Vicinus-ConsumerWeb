'use client'

import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight } from 'lucide-react'
import type { DashboardProperty, OpenHouseVisit, OpenHouseVisitGroup } from '@/types/dashboard'
import { useOpenHouseVisits } from '@/hooks/useOpenHouseVisits'
import { formatOpenHouseTimeRange } from '@/lib/format'

function buildAddress(p: DashboardProperty): string {
  const parts = [
    p.streetNumber && p.streetName ? `${p.streetNumber} ${p.streetName}` : null,
    p.city,
    p.province,
  ].filter(Boolean)
  return parts.join(', ') || 'Address not available'
}

function formatOpenHouseDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-CA', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })
}

// Soonest PLANNED visit that hasn't happened yet — the same source of truth
// as "My Open House Schedule" below it, so the hero can never drift from what
// the user actually put on their calendar.
function pickNextVisit(groups: OpenHouseVisitGroup[] | undefined): OpenHouseVisit | null {
  const now = new Date()
  const upcoming = (groups ?? [])
    .flatMap((g) => g.visits)
    .filter((v) => v.status === 'PLANNED' && v.property && v.openHouseDate && new Date(v.openHouseDate) >= now)
    .sort((a, b) => new Date(a.openHouseDate!).getTime() - new Date(b.openHouseDate!).getTime())
  return upcoming[0] ?? null
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-[#E8E6E1] bg-white flex items-center justify-center h-72 text-sm text-[#6B6B6B] text-center px-6">
      No upcoming open houses on your calendar yet — add one from a property page.
    </div>
  )
}

export default function FeaturedProperty() {
  const { data: groups, isLoading } = useOpenHouseVisits()

  if (isLoading) return null

  const visit = pickNextVisit(groups)
  if (!visit || !visit.property) return <EmptyState />

  const property = visit.property
  const imageUrl =
    property.primaryPhotoUrl ||
    'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&q=80'

  const propertyName =
    property.streetNumber && property.streetName
      ? `${property.streetNumber} ${property.streetName}`
      : buildAddress(property)

  return (
    <Link
      href={`/properties/${property.id}`}
      className="block rounded-2xl overflow-hidden border border-[#E8E6E1] shadow-sm group"
    >
      <div className="relative h-72 sm:h-80">
        <Image
          src={imageUrl}
          alt={propertyName}
          fill
          sizes="(max-width: 768px) 100vw, 800px"
          className="object-cover object-left-top group-hover:scale-105 transition-transform duration-500"
          priority
        />

        {/* Dark gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

        {/* Top-left: NEXT OPEN HOUSE badge */}
        <div className="absolute top-4 left-4">
          <span className="bg-[#1C3829] text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest">
            Next Open House
          </span>
        </div>

        {/* Bottom overlay: property name + date/time */}
        <div className="absolute bottom-0 left-0 right-0 p-5 flex items-end justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="font-heading text-2xl sm:text-3xl font-semibold text-white mb-1.5 leading-tight">
              {propertyName}
            </p>
            {visit.openHouseDate && (
              <div className="flex flex-wrap items-center gap-3 text-white/80 text-xs">
                <span>📅 {formatOpenHouseDate(visit.openHouseDate)}</span>
                {(visit.openHouseStartTime || visit.openHouseEndTime) && (
                  <span>
                    🕑 {formatOpenHouseTimeRange(visit.openHouseStartTime, visit.openHouseEndTime)}
                  </span>
                )}
              </div>
            )}
          </div>

          <span className="shrink-0 flex items-center gap-1.5 bg-[#1C3829] text-white text-[11px] font-bold px-3 py-2 rounded-xl uppercase tracking-wide group-hover:bg-[#2D5A3D] transition-colors whitespace-nowrap">
            View Listing
            <ArrowRight size={12} />
          </span>
        </div>
      </div>
    </Link>
  )
}
