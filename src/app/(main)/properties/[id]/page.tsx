// FE-401: Property Detail Page
// NOTE: params is a Promise<{ id }> in Next.js 15/16 App Router — must be awaited
//
// The body lives in <PropertyDetailView> because the same route is also
// intercepted into a Zillow-style overlay (app/(main)/@propertyModal). This
// file is only reached on a hard navigation / direct link / refresh, where
// layout.tsx puts the same panel shell around it so the presentation survives.
import type { Metadata } from 'next'
import { getPropertyDetail } from '@/lib/api/properties'
import PropertyDetailView from '@/components/property/PropertyDetailView'

// ─── Metadata ─────────────────────────────────────────────────────────────────

/** SEO-05 / SEO-18(c) — DDF listing detail may NOT be indexed at our REAW tier.
 *
 *  `robots.txt` already disallows `/properties`, but Disallow only stops
 *  *crawling* — a URL discovered through an inbound link can still be indexed
 *  (URL-only, no snippet). `noindex` is the authoritative directive, and it
 *  costs nothing to serve even while the path is disallowed: if crawl is ever
 *  re-opened (which requires CREA-09 first, since Googlebot executes JS and
 *  would fire `view` events to CREA), this is already in place rather than
 *  being remembered at that moment.
 *
 *  ⚠️ Do not remove without re-reading SEO-05 — the answer was an unqualified
 *  no, not a "not yet". */
const NOINDEX = { index: false, follow: false } as const

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const property = await getPropertyDetail(id)
  if (!property) return { title: 'Property not found', robots: NOINDEX }
  // Rentals price in the $1000s/mo — the millions formatter rendered "$0.00M".
  const price = property.price
    ? property.listingType === 'For Rent'
      ? `$${property.price.toLocaleString('en-CA')}/mo`
      : `$${(property.price / 1_000_000).toFixed(2)}M`
    : null
  const title = price
    ? `${property.address} — ${price}`
    : property.address
  return {
    title,
    description: `${property.beds} bed · ${property.baths} bath · ${property.sqft.toLocaleString()} sqft — ${property.city}. Listed by ${property.brokerageName}.`,
    robots: NOINDEX,
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function PropertyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  // Next.js 16: params is a Promise — must be awaited
  const { id } = await params
  return <PropertyDetailView id={id} />
}
