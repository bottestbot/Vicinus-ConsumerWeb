import { useQuery } from '@tanstack/react-query'
import { getNeighbourhoodDetail } from '@/lib/api/neighbourhoods'

/** Fetches the aggregate neighbourhood detail payload (NBHD-09). Until the
 *  backend `/detail` endpoint ships, `getNeighbourhoodDetail` composes the
 *  response from the live endpoints — see src/lib/api/neighbourhoods.ts.
 *
 *  ⚠️ Do NOT add `initialData` here (SEO-03). The detail page now fetches this
 *  same payload server-side, and seeding it looks like the obvious next step —
 *  it is a trap either way:
 *
 *    • seed the full payload → the DDF fields (marketSnapshot, liveListings,
 *      housingAge) land in server-rendered HTML, which is exactly what SEO-03
 *      must avoid while SEO-05 is unresolved;
 *    • seed a DDF-stripped payload → TanStack treats it as fresh data under the
 *      `staleTime` below and never refetches, so the live listings and market
 *      snapshot silently stay empty for real users.
 *
 *  The page instead splits the render: non-DDF sections are Server Components,
 *  DDF sections are client islands that call this hook and share one request via
 *  the query key. See src/components/neighbourhood/nonDdfDetail.ts. */
export function useNeighbourhoodDetail(slug: string) {
  return useQuery({
    queryKey: ['neighbourhood-detail', slug] as const,
    queryFn: () => getNeighbourhoodDetail(slug),
    enabled: Boolean(slug),
    staleTime: 300_000,
  })
}
