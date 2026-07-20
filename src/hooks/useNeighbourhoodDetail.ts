import { useQuery } from '@tanstack/react-query'
import { getNeighbourhoodDetail } from '@/lib/api/neighbourhoods'

/** Fetches the aggregate neighbourhood detail payload (NBHD-09). Until the
 *  backend `/detail` endpoint ships, `getNeighbourhoodDetail` composes the
 *  response from the live endpoints — see src/lib/api/neighbourhoods.ts. */
export function useNeighbourhoodDetail(slug: string) {
  return useQuery({
    queryKey: ['neighbourhood-detail', slug] as const,
    queryFn: () => getNeighbourhoodDetail(slug),
    enabled: Boolean(slug),
    staleTime: 300_000,
  })
}
