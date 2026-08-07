// Shared-reel landing page — the target of the Feed card's Share button.
//
// Sharing used to hand out /properties/[id], which dropped the recipient on a
// static detail page: the video they were actually shown was nowhere on it.
// This route opens the Feed with that listing hoisted to the front, so the
// thing that gets shared is the thing that gets seen.
//
// The reel itself is pinned client-side (see FeedView's `pinnedReelId`) — the
// listing's `video` only comes back from search, so the feed is scoped to the
// listing's own city here and the card is hoisted out of that page.
//
// NOTE: params is a Promise<{ id }> in Next.js 16 App Router — must be awaited.
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import PropertySearchScreen from '@/components/search/PropertySearchScreen'
import { getPropertyDetail } from '@/lib/api/properties'
import type { PropertyDetail } from '@/types/property'

interface PageProps {
  params: Promise<{ id: string }>
}

// Rentals price in the $1000s/mo — the millions formatter renders "$0.00M".
// Same split as the property page's metadata.
function priceLabel(property: PropertyDetail): string | null {
  if (!property.price) return null
  return property.listingType === 'For Rent'
    ? `$${property.price.toLocaleString('en-CA')}/mo`
    : `$${(property.price / 1_000_000).toFixed(2)}M`
}

// A shared link is only as good as its unfurl — a bare title in iMessage is the
// difference between a tap and a scroll past. The listing's own photo carries
// it, so no generated OG image is needed here.
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const property = await getPropertyDetail(id)
  if (!property) return { title: 'Reel not found' }

  const price = priceLabel(property)
  const title = price ? `${property.address} — ${price}` : property.address
  const description = [
    [
      property.beds > 0 ? `${property.beds} bed` : null,
      property.baths > 0 ? `${property.baths} bath` : null,
      property.sqft > 0 ? `${property.sqft.toLocaleString()} sqft` : null,
    ]
      .filter(Boolean)
      .join(' · '),
    property.city,
  ]
    .filter(Boolean)
    .join(' — ')

  // Setting `openGraph` replaces the root layout's rather than merging with it,
  // so siteName/type are repeated here (same reason as the vibe result page).
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      siteName: 'Vicinus',
      type: 'video.other',
      url: `/reel/${id}`,
      images: property.images?.length ? [property.images[0]] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: property.images?.length ? [property.images[0]] : undefined,
    },
  }
}

export default async function ReelPage({ params }: PageProps) {
  const { id } = await params
  // A dead/mistyped id should 404 rather than open an unscoped feed with
  // nothing pinned — that would look like a working link that silently lost
  // the listing it was sent for.
  const property = await getPropertyDetail(id)
  if (!property) notFound()

  return (
    <PropertySearchScreen
      listingType={property.listingType}
      initialViewMode="list"
      pinnedReelId={id}
      // City-scoped with no `query`: an empty query keeps the hydration effect
      // off its "search arrived from the hero bar" path, which would force the
      // Map view and undo initialViewMode. `city` alone makes the feed this
      // listing's city, which is both where the pinned reel is found and a
      // sensible place for the recipient to keep scrolling.
      initial={{
        query: '',
        minPrice: null,
        maxPrice: null,
        beds: null,
        baths: null,
        propertyType: [],
        city: property.city,
      }}
    />
  )
}
