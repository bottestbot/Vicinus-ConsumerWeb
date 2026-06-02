import type { Metadata } from 'next'
import SearchPageClient from './SearchPageClient'

export const metadata: Metadata = {
  title: 'Search Properties',
  description: 'Search luxury Canadian real estate listings — filter by city, price, bedrooms, and more.',
}

export default function SearchPage() {
  return <SearchPageClient />
}
