import { permanentRedirect } from 'next/navigation'
import type { SearchParamsInput } from '@/lib/searchParams'

// /search predates the Buy/Rent split. Fifteen internal call sites linked here
// (homepage CTA, hero bar, neighbourhood CTAs, dashboard saved/recent searches),
// plus any bookmarked or indexed links, so the route stays as a redirect rather
// than being deleted.
//
// 308 (permanentRedirect) rather than 307: a temporary redirect would split
// search rank between /search and /buy.
export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<SearchParamsInput>
}) {
  const sp = await searchParams

  // Forward every param through untouched — /buy parses the same vocabulary.
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(sp)) {
    if (Array.isArray(value)) value.forEach((v) => params.append(key, v))
    else if (value !== undefined) params.set(key, value)
  }

  // `listingType=For Rent` was never parsed here, but it has always been
  // written into saved-search and RecentSearches URLs — honour it now that the
  // two listing types have their own routes.
  // Case-insensitive: every value the app writes is exactly "For Rent", but this
  // also has to survive hand-typed and third-party links.
  const target =
    params.get('listingType')?.trim().toLowerCase() === 'for rent' ? '/rent' : '/buy'
  params.delete('listingType')

  const qs = params.toString()
  permanentRedirect(qs ? `${target}?${qs}` : target)
}
