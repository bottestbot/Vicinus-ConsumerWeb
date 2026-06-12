'use client'

// FE-2: PropertyFacts — Redfin-style tabbed Facts & features
// Interior / Exterior / Finance. HIDE-EMPTY at row / group / tab level.
import { useState } from 'react'
import {
  Bed,
  Bath,
  Sparkles,
  ChefHat,
  Thermometer,
  LayoutGrid,
  Flame,
  Ruler,
  ShieldCheck,
  DoorOpen,
  Car,
  Trees,
  Waves,
  Eye,
  Hammer,
  Droplets,
  Fence,
  Map as MapIcon,
  DollarSign,
  Receipt,
  CalendarDays,
  KeyRound,
  Building2,
  Home,
  type LucideIcon,
} from 'lucide-react'
import type { PropertyFactsDetails, PropertyRoom } from '@/types/property'

// ─── Value helpers ──────────────────────────────────────────────────────────────

type RowValue = string | number | null | undefined

interface FactRow {
  label: string
  value: RowValue
}

interface FactGroup {
  icon: LucideIcon
  label: string
  rows: FactRow[]
  // optional custom node (e.g. room list) rendered below the rows
  extra?: React.ReactNode
}

function joinList(arr: string[] | null | undefined): string | null {
  if (!Array.isArray(arr)) return null
  const cleaned = arr.map((s) => (s ?? '').trim()).filter(Boolean)
  return cleaned.length ? cleaned.join(', ') : null
}

function num(n: number | null | undefined, opts?: { suffix?: string; prefix?: string }): string | null {
  if (n == null || Number.isNaN(n)) return null
  return `${opts?.prefix ?? ''}${n.toLocaleString()}${opts?.suffix ?? ''}`
}

function yesOrNull(b: boolean | null | undefined): string | null {
  return b === true ? 'Yes' : null
}

function readableDate(iso: string | null | undefined): string | null {
  if (!iso) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  return d.toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' })
}

/** A row "counts" only when its value renders to something non-empty. */
function hasValue(v: RowValue): boolean {
  if (v == null) return false
  if (typeof v === 'string') return v.trim().length > 0
  if (typeof v === 'number') return !Number.isNaN(v)
  return true
}

// ─── Group builders (apply HIDE-EMPTY by filtering rows, then groups) ────────────

function visibleGroups(groups: FactGroup[]): FactGroup[] {
  return groups
    .map((g) => ({ ...g, rows: g.rows.filter((r) => hasValue(r.value)) }))
    .filter((g) => g.rows.length > 0 || g.extra != null)
}

function buildInterior(d: PropertyFactsDetails['interior']): FactGroup[] {
  const rooms: PropertyRoom[] = Array.isArray(d.rooms) ? d.rooms : []
  const visibleRooms = rooms.filter(
    (r) => hasValue(r.type) || hasValue(r.level) || hasValue(r.dimensions),
  )

  const groups: FactGroup[] = [
    {
      icon: Bed,
      label: 'Bedrooms & bathrooms',
      rows: [
        { label: 'Bedrooms above grade', value: num(d.bedroomsAboveGrade) },
        { label: 'Bedrooms below grade', value: num(d.bedroomsBelowGrade) },
        { label: 'Bathrooms (total)', value: num(d.bathsTotal) },
        { label: 'Full bathrooms', value: num(d.bathsFull) },
        { label: 'Partial bathrooms', value: num(d.bathsPartial) },
      ],
    },
    {
      icon: DoorOpen,
      label: 'Rooms',
      rows: [],
      extra: visibleRooms.length ? <RoomList rooms={visibleRooms} /> : undefined,
    },
    {
      icon: ChefHat,
      label: 'Appliances',
      rows: [{ label: 'Appliances', value: joinList(d.appliances) }],
    },
    {
      icon: Thermometer,
      label: 'Heating & cooling',
      rows: [
        { label: 'Heating', value: joinList(d.heating) },
        { label: 'Cooling', value: joinList(d.cooling) },
      ],
    },
    {
      icon: LayoutGrid,
      label: 'Flooring',
      rows: [{ label: 'Flooring', value: joinList(d.flooring) }],
    },
    {
      icon: Home,
      label: 'Basement',
      rows: [{ label: 'Basement', value: joinList(d.basement) }],
    },
    {
      icon: Flame,
      label: 'Fireplace',
      rows: [
        { label: 'Fireplace', value: yesOrNull(d.fireplaceYN) },
        { label: 'Fireplaces (total)', value: num(d.fireplacesTotal) },
        { label: 'Features', value: joinList(d.fireplaceFeatures) },
      ],
    },
    {
      icon: Ruler,
      label: 'Interior area',
      rows: [
        { label: 'Above grade finished', value: num(d.aboveGradeFinishedArea, { suffix: ' sqft' }) },
        { label: 'Below grade finished', value: num(d.belowGradeFinishedArea, { suffix: ' sqft' }) },
      ],
    },
    {
      icon: ShieldCheck,
      label: 'Security',
      rows: [{ label: 'Security features', value: joinList(d.securityFeatures) }],
    },
  ]
  return visibleGroups(groups)
}

function buildExterior(d: PropertyFactsDetails['exterior']): FactGroup[] {
  const lotSize =
    d.lotSizeArea != null
      ? `${d.lotSizeArea.toLocaleString()}${d.lotSizeUnits ? ` ${d.lotSizeUnits}` : ''}`
      : null
  const frontage =
    d.frontageLength != null
      ? `${d.frontageLength.toLocaleString()}${d.frontageUnits ? ` ${d.frontageUnits}` : ''}`
      : null

  const groups: FactGroup[] = [
    {
      icon: Car,
      label: 'Parking',
      rows: [
        { label: 'Parking spaces', value: num(d.parkingTotal) },
        { label: 'Parking features', value: joinList(d.parkingFeatures) },
      ],
    },
    {
      icon: Trees,
      label: 'Lot',
      rows: [
        { label: 'Lot size', value: lotSize },
        { label: 'Dimensions', value: d.lotSizeDimensions },
        { label: 'Frontage', value: frontage },
        { label: 'Lot features', value: joinList(d.lotFeatures) },
      ],
    },
    {
      icon: Waves,
      label: 'Pool',
      rows: [{ label: 'Pool features', value: joinList(d.poolFeatures) }],
    },
    {
      icon: Eye,
      label: 'View',
      rows: [
        { label: 'View', value: joinList(d.view) || yesOrNull(d.viewYN) },
      ],
    },
    {
      icon: Sparkles,
      label: 'Exterior features',
      rows: [{ label: 'Exterior features', value: joinList(d.exteriorFeatures) }],
    },
    {
      icon: Hammer,
      label: 'Construction',
      rows: [
        { label: 'Architectural style', value: joinList(d.architecturalStyle) },
        { label: 'Structure type', value: joinList(d.structureType) },
        { label: 'Construction materials', value: joinList(d.constructionMaterials) },
        { label: 'Year built', value: d.yearBuilt },
        { label: 'Stories', value: num(d.stories) },
      ],
    },
    {
      icon: Droplets,
      label: 'Utilities',
      rows: [
        { label: 'Sewer', value: joinList(d.sewer) },
        { label: 'Water source', value: joinList(d.waterSource) },
      ],
    },
    {
      icon: Fence,
      label: 'Fencing',
      rows: [{ label: 'Fencing', value: joinList(d.fencing) }],
    },
    {
      icon: MapIcon,
      label: 'Zoning',
      rows: [
        { label: 'Zoning', value: d.zoning },
        { label: 'Zoning description', value: d.zoningDescription },
      ],
    },
  ]
  return visibleGroups(groups)
}

function buildFinance(d: PropertyFactsDetails['finance']): FactGroup[] {
  const hoaFee =
    d.associationFee != null
      ? `$${d.associationFee.toLocaleString()}${
          d.associationFeeFrequency ? ` / ${d.associationFeeFrequency}` : ''
        }`
      : null

  const groups: FactGroup[] = [
    {
      icon: DollarSign,
      label: 'Price',
      rows: [
        { label: 'List price', value: num(d.price, { prefix: '$' }) },
        { label: 'Price per sqft', value: d.pricePerSqft != null ? `$${d.pricePerSqft.toLocaleString()}/sqft` : null },
      ],
    },
    {
      icon: Receipt,
      label: 'Taxes',
      rows: [
        { label: 'Annual tax', value: num(d.taxAnnualAmount, { prefix: '$' }) },
        { label: 'Tax year', value: d.taxYear },
      ],
    },
    {
      icon: CalendarDays,
      label: 'Listing',
      rows: [{ label: 'Date on market', value: readableDate(d.listedAt) }],
    },
    {
      icon: KeyRound,
      label: 'Ownership',
      rows: [{ label: 'Common interest', value: d.commonInterest }],
    },
    {
      icon: Building2,
      label: 'HOA',
      rows: [
        { label: 'Association fee', value: hoaFee },
        { label: 'Fee includes', value: joinList(d.associationFeeIncludes) },
      ],
    },
    {
      icon: MapIcon,
      label: 'Subdivision',
      rows: [{ label: 'Subdivision', value: d.subdivisionName }],
    },
    {
      icon: Home,
      label: 'Property type',
      rows: [{ label: 'Property subtype', value: d.propertySubType }],
    },
  ]
  return visibleGroups(groups)
}

// ─── Sub-components ──────────────────────────────────────────────────────────────

function RoomList({ rooms }: { rooms: PropertyRoom[] }) {
  return (
    <ul className="space-y-1">
      {rooms.map((r, i) => {
        const parts = [r.type, r.level, r.dimensions].filter((p) => hasValue(p))
        return (
          <li key={i} className="text-sm text-[#6B6B6B]">
            {parts.join(' · ')}
          </li>
        )
      })}
    </ul>
  )
}

function GroupBlock({ group }: { group: FactGroup }) {
  const Icon = group.icon
  return (
    <div className="break-inside-avoid">
      <div className="flex items-center gap-2 mb-2">
        <Icon size={15} className="text-[#1C3829]" />
        <h3 className="text-sm font-semibold text-[#111111]">{group.label}</h3>
      </div>
      {group.rows.length > 0 && (
        <dl className="space-y-1">
          {group.rows.map((row) => (
            <div key={row.label} className="flex items-start justify-between gap-4 text-sm">
              <dt className="text-[#6B6B6B]">{row.label}</dt>
              <dd className="text-[#111111] text-right font-medium">{String(row.value)}</dd>
            </div>
          ))}
        </dl>
      )}
      {group.extra}
    </div>
  )
}

// ─── Main component ──────────────────────────────────────────────────────────────

type TabKey = 'interior' | 'exterior' | 'finance'

interface PropertyFactsProps {
  details: PropertyFactsDetails
}

export default function PropertyFacts({ details }: PropertyFactsProps) {
  const tabs: { key: TabKey; label: string; groups: FactGroup[] }[] = [
    { key: 'interior', label: 'Interior', groups: buildInterior(details.interior) },
    { key: 'exterior', label: 'Exterior', groups: buildExterior(details.exterior) },
    { key: 'finance', label: 'Finance', groups: buildFinance(details.finance) },
  ]

  const available = tabs.filter((t) => t.groups.length > 0)
  const [active, setActive] = useState<TabKey>(available[0]?.key ?? 'interior')

  // HIDE the whole section if no tab has any content.
  if (available.length === 0) return null

  // Guard against the active tab having been filtered out.
  const activeTab = available.find((t) => t.key === active) ?? available[0]

  return (
    <section>
      <div className="flex items-center gap-2 mb-4">
        <h2 className="font-heading text-xl font-semibold text-[#111111]">Facts &amp; features</h2>
      </div>

      {/* ── Tabs ──────────────────────────────────────────────────────────── */}
      <div className="flex gap-1 border-b border-[#E8E6E1] mb-6">
        {available.map((t) => {
          const isActive = t.key === activeTab.key
          return (
            <button
              key={t.key}
              onClick={() => setActive(t.key)}
              className={`px-4 py-2.5 text-sm font-medium -mb-px border-b-2 transition-colors ${
                isActive
                  ? 'border-[#1C3829] text-[#111111]'
                  : 'border-transparent text-[#6B6B6B] hover:text-[#111111]'
              }`}
            >
              {t.label}
            </button>
          )
        })}
      </div>

      {/* ── Active tab content ────────────────────────────────────────────── */}
      <div className="columns-1 md:columns-2 gap-8 space-y-6 [&>*]:mb-6">
        {activeTab.groups.map((group) => (
          <GroupBlock key={group.label} group={group} />
        ))}
      </div>
    </section>
  )
}
