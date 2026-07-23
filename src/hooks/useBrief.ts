import { useQuery } from '@tanstack/react-query'
import { getBrief } from '@/lib/api/brief'
import type { Brief } from '@/types/dashboard'

export const BRIEF_KEY = ['brief'] as const

// Session cache key. Bump the suffix if the Brief contract changes so a stale
// shape from a previous deploy can't be replayed within an open tab.
const SESSION_KEY = 'vicinus:iq-brief:v1'

/**
 * Fetch the brief at most ONCE per browser session. The brief is backed by a
 * Gemini call and is stable for the visit, so recomputing it on every dashboard
 * mount/refresh is wasteful (and slow on a cold cache). We persist the first
 * successful result in `sessionStorage` and serve it for the rest of the tab
 * session — a soft navigation or a reload reuses it; only a brand-new session
 * (new tab, or after the tab is closed) recomputes.
 *
 * Trade-off: the card won't reflect activity that happens mid-session. That's
 * intended — "calculate once, keep it for the session." A future explicit
 * "refresh" would just clear SESSION_KEY and invalidate BRIEF_KEY.
 */
async function fetchBriefOnce(): Promise<Brief> {
  if (typeof window !== 'undefined') {
    const cached = window.sessionStorage.getItem(SESSION_KEY)
    if (cached) {
      try {
        return JSON.parse(cached) as Brief
      } catch {
        // Corrupt entry — fall through and refetch.
      }
    }
  }

  const brief = (await getBrief()).data

  if (typeof window !== 'undefined') {
    try {
      window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(brief))
    } catch {
      // sessionStorage full/blocked — non-fatal, we just recompute next mount.
    }
  }

  return brief
}

/**
 * Read the Vicinus IQ Brief (BRIEF-09). Client-side by design — the brief is a
 * Gemini-backed call, and server-rendering personalization already caused a
 * regression (commit 5530d4d), so we mirror `useOpenHouseVisits` and keep it off
 * the dashboard's server render.
 *
 * Never refetched within a session: `staleTime: Infinity` + the sessionStorage
 * cache in `fetchBriefOnce` mean React Query won't refetch on mount, focus or
 * reconnect, and a reload replays the cached copy. A failure surfaces as
 * `isError` (no retry) and the component degrades to a static line.
 */
export function useBrief() {
  return useQuery<Brief>({
    queryKey: BRIEF_KEY,
    queryFn: fetchBriefOnce,
    staleTime: Infinity,
    gcTime: Infinity,
    retry: false,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  })
}
