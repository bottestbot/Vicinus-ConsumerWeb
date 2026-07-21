'use client'

// Shared listing-info cell (Task #12). Single source of truth for the block of
// listing metadata that appears on every card surface: price, address, a
// secondary location line, beds/baths/sqft/type stats, and the CREA-compliance
// attribution (brokerage + MLS® + deep-linked "Powered by REALTOR.ca" badge).
//
// Refactor every card surface through this so field order, formatting, spacing,
// typography, and truncation are identical everywhere. Preserve each surface's
// own outer shell / image treatment — only the info cell is standardized.
import { Fragment, type ComponentType } from 'react'
import { Bed, Bath, Maximize2 } from 'lucide-react'
import { formatPrice, formatNumber, realtorHref } from '@/lib/format'
import { logListingClick } from '@/lib/api/analytics'
import { STRINGS } from '@/lib/strings'

export interface PropertyCellData {
  price?: number | null
  /** Primary street line, e.g. "123 Main St". */
  address: string
  /** Secondary location line, e.g. "Vancouver, BC V6B 1A1". */
  location?: string | null
  beds?: number | null
  baths?: number | null
  sqft?: number | null
  propertyType?: string | null
  agentName?: string | null
  brokerageName?: string | null
  mlsNumber?: string | null
  /** DDF ListingURL — deep-links the REALTOR.ca badge to this exact listing. */
  realtorUrl?: string | null
  /** DDF ListingKey. Needed to report the CREA `Click` event (CREA-05). */
  listingKey?: string | null
}

type Theme = 'light' | 'dark'

// Colour tokens per theme. `dark` is used when the cell sits over imagery
// (e.g. the vertical feed); `light` is the default card treatment.
const TONE: Record<Theme, {
  price: string
  address: string
  location: string
  stats: string
  sep: string
  divider: string
  muted: string
  strong: string
  link: string
}> = {
  light: {
    price: 'text-[#111111]',
    address: 'text-[#111111]',
    location: 'text-[#6B6B6B]',
    stats: 'text-[#6B6B6B]',
    sep: 'text-[#E8E6E1]',
    divider: 'border-[#F2F0EB]',
    muted: 'text-[#6B6B6B]',
    strong: 'text-[#111111]',
    link: 'text-[#6B6B6B] hover:text-[#1C3829]',
  },
  dark: {
    price: 'text-white',
    address: 'text-white',
    location: 'text-white/80',
    stats: 'text-white/90',
    sep: 'text-white/30',
    divider: 'border-white/15',
    muted: 'text-white/55',
    strong: 'text-white/80',
    link: 'text-white/70 hover:text-white',
  },
}

interface AttributionProps {
  agentName?: string | null
  brokerageName?: string | null
  mlsNumber?: string | null
  realtorUrl?: string | null
  /** DDF ListingKey — reports the CREA `Click` event on the badge (CREA-05). */
  listingKey?: string | null
  theme?: Theme
  /** Show the "Data provided by CREA" line (default true). */
  showCrea?: boolean
  /** Render the top border + padding that separates it from the cell (default true). */
  bordered?: boolean
  className?: string
}

/**
 * CREA-compliance attribution: brokerage / agent, the MLS® number, and the
 * deep-linked "Powered by REALTOR.ca" badge. Exported so surfaces with a
 * bespoke body (the vertical feed, the detail page) can drop in the exact same
 * badge without adopting the whole cell.
 */
export function ListingAttribution({
  agentName,
  brokerageName,
  mlsNumber,
  realtorUrl,
  listingKey,
  theme = 'light',
  showCrea = true,
  bordered = true,
  className = '',
}: AttributionProps) {
  const t = TONE[theme]
  return (
    <div className={`${bordered ? `pt-2 border-t ${t.divider}` : ''} ${className}`.trim()}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          {agentName && (
            <p className={`text-[9px] font-semibold leading-tight ${t.strong} truncate`}>{agentName}</p>
          )}
          {brokerageName && (
            <p className={`text-[9px] leading-tight ${t.muted} truncate`}>{brokerageName}</p>
          )}
          {mlsNumber && <p className={`text-[9px] leading-tight ${t.muted}`}>MLS® {mlsNumber}</p>}
        </div>
        <a
          href={realtorHref(realtorUrl)}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => {
            e.stopPropagation()
            // CREA-05: click-through to the listing on REALTOR.ca is the
            // `Click` event the REAW tier requires us to report.
            if (listingKey) logListingClick(listingKey)
          }}
          className={`text-[9px] ${t.link} transition-colors text-right shrink-0 leading-tight`}
        >
          {STRINGS.SEARCH_CARD_POWERED_BY}
          <br />
          <span className="font-semibold">{STRINGS.SEARCH_CARD_REALTOR_CA}</span>
        </a>
      </div>
      {showCrea && (
        <p className={`text-[9px] leading-tight ${t.muted} mt-0.5`}>{STRINGS.SEARCH_CARD_DATA_CREA}</p>
      )}
    </div>
  )
}

interface PropertyCellProps {
  data: PropertyCellData
  theme?: Theme
  /** Tighter type + spacing for small surfaces like the map popup. */
  compact?: boolean
  /** Render the attribution/badge footer (default true). */
  showAttribution?: boolean
  className?: string
}

export default function PropertyCell({
  data,
  theme = 'light',
  compact = false,
  showAttribution = true,
  className = '',
}: PropertyCellProps) {
  const t = TONE[theme]
  const { price, address, location, beds, baths, sqft, propertyType } = data

  const priceLabel =
    price != null && price > 0 ? formatPrice(price) : STRINGS.SEARCH_CARD_PRICE_ON_REQUEST

  // Field order is fixed here so every surface renders it identically.
  const stats: { icon?: ComponentType<{ size?: number }>; text: string; sr: string }[] = []
  if (beds != null && beds > 0) {
    stats.push({ icon: Bed, text: `${beds} ${STRINGS.SEARCH_CARD_BEDS_ABBR}`, sr: `${beds} bedrooms` })
  }
  if (baths != null && baths > 0) {
    stats.push({ icon: Bath, text: `${baths} ${STRINGS.SEARCH_CARD_BATHS_ABBR}`, sr: `${baths} bathrooms` })
  }
  if (sqft != null && sqft > 0) {
    stats.push({
      icon: Maximize2,
      text: `${formatNumber(sqft)} ${STRINGS.SEARCH_CARD_SQFT}`,
      sr: `${formatNumber(sqft)} square feet`,
    })
  }
  if (propertyType) {
    stats.push({ text: propertyType, sr: propertyType })
  }

  return (
    <div className={className}>
      <p
        className={`font-heading font-semibold leading-tight ${t.price} ${
          compact ? 'text-lg' : 'text-xl'
        } mb-0.5`}
      >
        {priceLabel}
      </p>

      <p className={`text-sm ${t.address} truncate ${location ? 'mb-0.5' : 'mb-2.5'}`}>{address}</p>

      {location && <p className={`text-xs ${t.location} truncate mb-2.5`}>{location}</p>}

      {stats.length > 0 && (
        <>
          <div
            className={`flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs ${t.stats}`}
            aria-hidden="true"
          >
            {stats.map((s, i) => (
              <Fragment key={i}>
                {i > 0 && <span className={t.sep}>·</span>}
                <span className="flex shrink-0 items-center gap-1 whitespace-nowrap">
                  {s.icon && <s.icon size={12} />}
                  {s.text}
                </span>
              </Fragment>
            ))}
          </div>
          <span className="sr-only">{stats.map((s) => s.sr).join(', ')}</span>
        </>
      )}

      {showAttribution && (
        <ListingAttribution
          agentName={data.agentName}
          brokerageName={data.brokerageName}
          mlsNumber={data.mlsNumber}
          realtorUrl={data.realtorUrl}
          listingKey={data.listingKey}
          theme={theme}
          className={compact ? 'mt-2.5' : 'mt-3'}
        />
      )}
    </div>
  )
}
