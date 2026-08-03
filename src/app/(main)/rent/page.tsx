import type { Metadata } from 'next'
import PropertySearchScreen from '@/components/search/PropertySearchScreen'
import { parseInitialSearch, type SearchParamsInput } from '@/lib/searchParams'

export const metadata: Metadata = {
  title: 'Apartments & Homes for Rent in Greater Vancouver',
  description:
    'Find apartments, condos, and houses for rent across Greater Vancouver and filter by neighbourhood, monthly rent, bedrooms, and property type.',
  alternates: {
    canonical: '/rent',
  },
}

export default async function RentPage({
  searchParams,
}: {
  searchParams: Promise<SearchParamsInput>
}) {
  const initial = parseInitialSearch(await searchParams)
  return <PropertySearchScreen listingType="For Rent" initial={initial} />
}
