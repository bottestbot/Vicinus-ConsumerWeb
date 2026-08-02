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

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const property = await getPropertyDetail(id)
  if (!property) return { title: 'Property not found' }
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
