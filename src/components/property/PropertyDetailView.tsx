// FE-401: Property Detail body — shared by the standalone page
// (`/properties/[id]`) and the Zillow-style overlay that intercepts the same
// route from search/feed/dashboard (see app/(main)/@propertyModal). Both render
// the *same* server component so the two surfaces can never drift.
//
// There is deliberately no `variant` prop any more: both surfaces now wrap this
// in <PropertyDetailPanel> (the page so that a refresh doesn't throw the user
// out of the card they were reading), so the body always renders inside a panel
// that owns the scroll container and the Back chrome. Anything that used to
// branch on the page variant — full-viewport offsets, the breadcrumb, a
// viewport-fixed ActionBar — would now be wrong on both.
import { Suspense } from 'react'
import Link from 'next/link'
import type { PropertyDetail } from '@/types/property'
import { getPropertyDetail, getListingOpenHouses, getNearbyOpenHouses, getMarketContext } from '@/lib/api/properties'
import { getNeighbourhoodDetail, resolveNeighbourhoodForPoint } from '@/lib/api/neighbourhoods'
import { realtorHref } from '@/lib/format'
import OpenHouseSchedule from '@/components/property/OpenHouseSchedule'
import PropertyGallery from '@/components/property/PropertyGallery'
import PropertyStats from '@/components/property/PropertyStats'
import PropertyFacts from '@/components/property/PropertyFacts'
import NeighbourhoodContextScore from '@/components/property/NeighbourhoodContextScore'
import MortgageAnalysis from '@/components/property/MortgageAnalysis'
import NearbyOpenHouses from '@/components/property/NearbyOpenHouses'
import MarketContext from '@/components/property/MarketContext'
import AssessmentHistory from '@/components/property/AssessmentHistory'
import SalesHistory from '@/components/property/SalesHistory'
import ListingActivityMap from '@/components/property/ListingActivityMap'
import ActionBar from '@/components/property/ActionBar'
import AgentCard from '@/components/property/AgentCard'
import TrackVisited from '@/components/property/TrackVisited'
import ListingViewTracker from '@/components/property/ListingViewTracker'
// import PropertySummary from '@/components/property/PropertySummary' // temporarily hidden from UI
import VirtualTour from '@/components/property/VirtualTour'
import PropertyLocationLinks from '@/components/property/PropertyLocationLinks'

// ─── Streamed sections ──────────────────────────────────────────────────────
// These fetch independently and are wrapped in <Suspense> below so the core
// property (gallery, stats, agent, facts) renders immediately instead of the
// whole page blocking on the slowest call — the AI summary regenerates on a
// cold cache and can take ~8s (see api RedisService / REDIS_URL).

function SectionSkeleton({ className = 'h-40' }: { className?: string }) {
  return <div className={`animate-pulse rounded-2xl bg-[#F2F0EB] ${className}`} />
}

async function OpenHouseSection({ id }: { id: string }) {
  const slots = await getListingOpenHouses(id)
  if (slots.length === 0) return null
  return <OpenHouseSchedule slots={slots} listingId={id} />
}

// Temporarily hidden from UI — restore alongside the <AiSummarySection> mount below.
// async function AiSummarySection({ id }: { id: string }) {
//   const summary = await getPropertyAiSummary(id)
//   if (!summary) return null
//   return <PropertySummary summary={summary} />
// }

async function NearbyOpenHousesSection({ id }: { id: string }) {
  const nearby = await getNearbyOpenHouses(id)
  if (nearby.length === 0) return null
  return <NearbyOpenHouses openHouses={nearby} />
}

async function MarketContextSection({ id, property }: { id: string; property: PropertyDetail }) {
  const data = await getMarketContext(id)
  return <MarketContext property={property} data={data} />
}

// Live DDF payloads carry no neighbourhood link, so resolve one from the
// listing's coordinates, then fetch the same aggregate the neighbourhood page
// uses. Both calls are shared-cached (no user data) and the section renders a
// degraded map-only variant when nothing resolves — never fabricated scores.
async function NeighbourhoodSection({ property }: { property: PropertyDetail }) {
  const resolved = await resolveNeighbourhoodForPoint(
    property.city,
    property.latitude,
    property.longitude,
  )
  const detail = resolved ? await getNeighbourhoodDetail(resolved.slug) : null
  return <NeighbourhoodContextScore property={property} detail={detail} />
}

// ─── Listing unavailable ──────────────────────────────────────────────────────
// Shown instead of the raw Next 404 when a key resolves to no live DDF listing.

function ListingUnavailable() {
  return (
    <div className="font-ui">
      <div className="mx-auto max-w-2xl px-6 py-24 text-center">
        <h1 className="font-heading text-3xl font-semibold text-[#111111] mb-3">
          This listing is no longer available.
        </h1>
        <p className="text-sm text-[#6B6B6B] mb-8">
          It may have sold or been taken off the market. Plenty more where that came from.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/buy"
            className="rounded-xl bg-[#1C3829] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#16301F]"
          >
            Browse listings
          </Link>
          <Link
            href="/neighbourhoods"
            className="rounded-xl border border-[#E8E6E1] bg-white px-5 py-3 text-sm font-semibold text-[#1C3829] transition-colors hover:border-[#1C3829]/40"
          >
            Explore neighbourhoods
          </Link>
        </div>
      </div>
    </div>
  )
}

// ─── View ─────────────────────────────────────────────────────────────────────

export default async function PropertyDetailView({ id }: { id: string }) {
  // Only block the shell on the fast core fetch (~0.5s). Everything slow or
  // non-critical streams in via Suspense below.
  const property = await getPropertyDetail(id)
  // JUL21FIX-03: a listing can vanish legitimately (sold/delisted between the
  // sync and this fetch), so this path is expected — but a bare 404 gave the
  // user nowhere to go and left us blind to bad keys. Log the key, offer a way
  // back. Genuine routing bugs surface here too, so keep the log.
  if (!property) {
    console.warn(`[property-detail] no DDF listing for key "${id}"`)
    return <ListingUnavailable />
  }

  return (
    // The scroll container, the viewport offsets and the Back chrome all belong
    // to <PropertyDetailPanel> — this only owns the body inside it.
    <div className="bg-[#FAF9F6] font-ui pb-8">
      {/* ── Track visited (client effect) ─────────────────────────────── */}
      <TrackVisited propertyId={id} />
      {/* ── CREA DDF `view` analytics event (Task #2). id is the ListingKey. ── */}
      <ListingViewTracker listingKey={id} price={property.price} city={property.city} beds={property.beds} />

      {/* No breadcrumb: the panel's own "Back" chrome sits directly above this
          and a second back affordance three lines below it just read as noise. */}

      {/* ── Main content area ─────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-10 pt-4">

        {/* ── Gallery ───────────────────────────────────────────────────── */}
        <PropertyGallery
          propertyId={id}
          images={property.images}
          address={property.address}
          price={property.price}
          listingType={property.listingType}
          beds={property.beds}
          baths={property.baths}
          sqft={property.sqft}
        />

        {/* ── Street View / map deep-links ──────────────────────────────── */}
        <PropertyLocationLinks
          latitude={property.latitude}
          longitude={property.longitude}
          address={`${property.address}, ${property.city}, ${property.province}`}
        />

        {/* ── Two-column: stats + agent card ────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Left: address + stats + description */}
          <div className="lg:col-span-2">
            <PropertyStats property={property} />
          </div>

          {/* Right: agent contact card */}
          <div className="lg:col-span-1">
            <AgentCard property={property} />
          </div>
        </div>

        {/* ── Video & virtual tour (live DDF only; hides when absent) ────── */}
        <VirtualTour
          youtubeUrl={property.youtubeUrl}
          virtualTourUrl={property.virtualTourUrl}
          listingKey={id}
        />

        {/* ── Facts & features (live DDF only; mock data lacks it) ──────── */}
        {property.details && <PropertyFacts details={property.details} />}

        {/* ── Open House schedule (live DDF, only if upcoming) ──────────── */}
        <Suspense fallback={null}>
          <OpenHouseSection id={id} />
        </Suspense>

        {/* ── AI Property Summary — temporarily hidden from UI ──────────────
        <Suspense fallback={<SectionSkeleton className="h-56" />}>
          <AiSummarySection id={id} />
        </Suspense>
        */}

        {/* ── Divider ───────────────────────────────────────────────────── */}
        <div className="border-t border-[#E8E6E1]" />

        {/* ── Neighbourhood Context ("Life around {address}") ───────────── */}
        <Suspense fallback={<SectionSkeleton className="h-96" />}>
          <NeighbourhoodSection property={property} />
        </Suspense>

        {/* ── Mortgage Analysis (dark green) — sales only: running a mortgage
            calculator over a monthly rent produced a nonsense "$13/mo" (RENT-02) */}
        {property.listingType !== 'For Rent' && (
          <MortgageAnalysis
            price={property.price}
            listingKey={id}
            propertyAddress={property.address}
          />
        )}

        {/* ── Nearby Open Houses (live DDF, falls back to mock for demo) ── */}
        <Suspense fallback={null}>
          <NearbyOpenHousesSection id={id} />
        </Suspense>

        {/* ── Market Context — sales only: every figure (price/sqft, price
            position, buyer competition) is benchmarked against sale medians,
            so a rent lands next to a "$19,930,000 area median" (RENT-02) */}
        {property.listingType !== 'For Rent' && (
          <Suspense fallback={<SectionSkeleton className="h-64" />}>
            <MarketContextSection id={id} property={property} />
          </Suspense>
        )}

        {/* ── Assessment History ────────────────────────────────────────── */}
        {property.assessmentHistory && property.assessmentHistory.length > 0 && (
          <AssessmentHistory records={property.assessmentHistory} />
        )}

        {/* ── Sales History ─────────────────────────────────────────────── */}
        {property.salesHistory && property.salesHistory.length > 0 && (
          <SalesHistory records={property.salesHistory} />
        )}

        {/* ── Listing Activity Map ──────────────────────────────────────── */}
        {property.nearbyListings && property.nearbyListings.length > 0 && (
          <ListingActivityMap
            latitude={property.latitude}
            longitude={property.longitude}
            address={property.address}
            currentPrice={property.price}
            nearbyListings={property.nearbyListings}
          />
        )}

        {/* ── CREA Compliance footer ────────────────────────────────────── */}
        <footer className="border-t border-[#E8E6E1] pt-6 pb-2">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <p className="text-xs text-[#6B6B6B]">
                Listing provided by{' '}
                <span className="font-semibold text-[#111111]">
                  {[property.agentName, property.brokerageName]
                    .filter(Boolean)
                    .join(' · ') || 'Listing Brokerage'}
                </span>
              </p>
              <p className="text-[10px] text-[#6B6B6B] mt-0.5">
                MLS® {property.mlsNumber} · Data provided by CREA and may not reflect all available listings. Information is deemed reliable but not guaranteed.
              </p>
            </div>
            {/* CREA DDF rule: "Powered by REALTOR.ca" badge linked back to the
                listing on REALTOR.ca. The SVG already reads "Powered by
                REALTOR.ca", so no separate caption is needed. */}
            <a
              href={realtorHref(property.realtorUrl)}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                width={125}
                src="https://www.realtor.ca/images/en-ca/powered_by_realtor.svg"
                alt="Powered by: REALTOR.ca"
              />
            </a>
          </div>
        </footer>
      </div>

      {/* ── Action Bar — always `sticky`: it pins to the bottom of the panel's
          scroll container. A viewport-fixed bar would hang outside the card on
          both surfaces now that the page is panelled too ───────────────── */}
      <ActionBar
        propertyId={id}
        agentName={property.agentName}
        agentPhone={property.agentPhone}
        brokerageName={property.brokerageName}
        mlsNumber={property.mlsNumber}
        position="sticky"
      />
    </div>
  )
}
