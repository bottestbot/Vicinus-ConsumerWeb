import type { Metadata } from 'next'
import PropertySearchScreen from '@/components/search/PropertySearchScreen'
import { parseInitialSearch, type SearchParamsInput } from '@/lib/searchParams'

export const metadata: Metadata = {
  title: 'Homes for Sale in Greater Vancouver',
  description:
    'Browse houses, condos, and townhomes for sale across Greater Vancouver and filter by neighbourhood, price, bedrooms, and property type.',
  alternates: {
    canonical: '/buy',
  },
}

export default async function BuyPage({
  searchParams,
}: {
  searchParams: Promise<SearchParamsInput>
}) {
  const initial = parseInitialSearch(await searchParams)
  return <PropertySearchScreen listingType="For Sale" initial={initial} />
}
