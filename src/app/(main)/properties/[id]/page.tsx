// FE-401: Property Detail Page
// NOTE: params is a Promise<{ id }> in Next.js 15/16 App Router — must be awaited
import type { Metadata } from 'next'
import { Suspense } from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import type { PropertyDetail } from '@/types/property'
import { getPropertyDetail, getListingOpenHouses, getNearbyOpenHouses, getPropertyAiSummary, getMarketContext } from '@/lib/api/properties'
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
import PropertySummary from '@/components/property/PropertySummary'
import VirtualTour from '@/components/property/VirtualTour'
import PropertyLocationLinks from '@/components/property/PropertyLocationLinks'

// ─── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const property = await getPropertyDetail(id)
  if (!property) return { title: 'Property not found' }
  const price = property.price
    ? `$${(property.price / 1_000_000).toFixed(2)}M`
    : null
  const title = price
    ? `${property.address} — ${price}`
    : property.address
  return {
    title,
    description: `${property.beds} bed · ${property.baths} bath · ${property.sqft.toLocaleString()} sqft — ${property.city}. Listed by ${property.brokerageName}.`,
  }
}

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

async function AiSummarySection({ id }: { id: string }) {
  const summary = await getPropertyAiSummary(id)
  if (!summary) return null
  return <PropertySummary summary={summary} />
}

async function NearbyOpenHousesSection({ id }: { id: string }) {
  const nearby = await getNearbyOpenHouses(id)
  if (nearby.length === 0) return null
  return <NearbyOpenHouses openHouses={nearby} />
}

async function MarketContextSection({ id, property }: { id: string; property: PropertyDetail }) {
  const data = await getMarketContext(id)
  return <MarketContext property={property} data={data} />
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function PropertyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  // Next.js 16: params is a Promise — must be awaited
  const { id } = await params

  // Only block the shell on the fast core fetch (~0.5s). Everything slow or
  // non-critical streams in via Suspense below.
  const property = await getPropertyDetail(id)
  if (!property) notFound()

  return (
    <div className="min-h-screen bg-[#FAF9F6] pt-16 pb-32 font-ui">
      {/* ── Track visited (client effect) ─────────────────────────────── */}
      <TrackVisited propertyId={id} />

      {/* ── Breadcrumb / Back nav ──────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4">
        <nav className="flex items-center gap-2 text-xs text-[#6B6B6B]">
          <Link href="/search" className="flex items-center gap-1 hover:text-[#1C3829] transition-colors">
            <ChevronLeft size={13} />
            Properties
          </Link>
          <span className="text-[#D1CEC9]">/</span>
          <span className="text-[#111111] truncate">{property.address}</span>
        </nav>
      </div>

      {/* ── Main content area ─────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-10">

        {/* ── Gallery ───────────────────────────────────────────────────── */}
        <PropertyGallery images={property.images} address={property.address} />

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
        />

        {/* ── Facts & features (live DDF only; mock data lacks it) ──────── */}
        {property.details && <PropertyFacts details={property.details} />}

        {/* ── Open House schedule (live DDF, only if upcoming) ──────────── */}
        <Suspense fallback={null}>
          <OpenHouseSection id={id} />
        </Suspense>

        {/* ── AI Property Summary (streams in — cold gen can take ~8s) ───── */}
        <Suspense fallback={<SectionSkeleton className="h-56" />}>
          <AiSummarySection id={id} />
        </Suspense>

        {/* ── Divider ───────────────────────────────────────────────────── */}
        <div className="border-t border-[#E8E6E1]" />

        {/* ── Neighbourhood Context Score ───────────────────────────────── */}
        <NeighbourhoodContextScore property={property} />

        {/* ── Mortgage Analysis (dark green) ────────────────────────────── */}
        <MortgageAnalysis price={property.price} />

        {/* ── Nearby Open Houses (live DDF, falls back to mock for demo) ── */}
        <Suspense fallback={null}>
          <NearbyOpenHousesSection id={id} />
        </Suspense>

        {/* ── Market Context ────────────────────────────────────────────── */}
        <Suspense fallback={<SectionSkeleton className="h-64" />}>
          <MarketContextSection id={id} property={property} />
        </Suspense>

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
            <a
              href="https://www.realtor.ca"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-[#6B6B6B] hover:text-[#1C3829] transition-colors shrink-0"
            >
              Powered by <span className="font-semibold">REALTOR.ca</span>
            </a>
          </div>
        </footer>
      </div>

      {/* ── Fixed Action Bar ──────────────────────────────────────────── */}
      <ActionBar
        propertyId={id}
        agentName={property.agentName}
        agentPhone={property.agentPhone}
        brokerageName={property.brokerageName}
        mlsNumber={property.mlsNumber}
      />
    </div>
  )
}
