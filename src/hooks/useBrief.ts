import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@clerk/nextjs'
import { getBrief } from '@/lib/api/brief'
import type { Brief } from '@/types/dashboard'

/**
 * Query key — user-scoped. A bare ['brief'] key let an account switch inside a
 * single tab serve the previous user's brief straight from the in-memory cache:
 * a client-side sign-out doesn't tear down the QueryClient, and this query never
 * refetches (see the options below), so nothing ever went back to the server to
 * notice the identity had changed.
 */
export const BRIEF_KEY = (userId: string | null | undefined) => ['brief', userId ?? null] as const

// Session cache key prefix. Bump the suffix if the Brief contract OR its copy
// changes so a stale version from a previous deploy can't be replayed within an
// open tab. v2: brief is now deterministic (no LLM), leads with the counts
// breakdown + "your saved searches and properties", and tidies DDF ALL-CAPS
// addresses.
//
// The `:${userId}` suffix is load-bearing, not cosmetic. sessionStorage survives
// a sign-out, so the unscoped key replayed one account's brief — its counts and
// the specific addresses it was tracking — to whoever signed in next in the same
// tab, including brand-new accounts with no activity at all.
export const BRIEF_SESSION_PREFIX = 'vicinus:iq-brief:v2'

const sessionKeyFor = (userId: string) => `${BRIEF_SESSION_PREFIX}:${userId}`

async function fetchBriefOnce(userId: string): Promise<Brief> {
  const sessionKey = sessionKeyFor(userId)

  if (typeof window !== 'undefined') {
    const cached = window.sessionStorage.getItem(sessionKey)
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
      window.sessionStorage.setItem(sessionKey, JSON.stringify(brief))
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
 * Fetched at most ONCE per browser session per user: `staleTime: Infinity` plus
 * the sessionStorage cache in `fetchBriefOnce` mean React Query won't refetch on
 * mount, focus or reconnect, and a reload replays the cached copy. A failure
 * surfaces as `isError` (no retry) and the component degrades to a static line.
 *
 * Trade-off: the card won't reflect activity that happens mid-session. That's
 * intended — "calculate once, keep it for the session." A future explicit
 * "refresh" would clear this user's session key and invalidate BRIEF_KEY(userId).
 */
export function useBrief() {
  const { isLoaded, userId } = useAuth()

  const query = useQuery<Brief>({
    queryKey: BRIEF_KEY(userId),
    queryFn: () => fetchBriefOnce(userId as string),
    // Never fetch before Clerk resolves the session — firing early would cache
    // the result under a null identity, which is the same bug wearing a hat.
    enabled: isLoaded && !!userId,
    staleTime: Infinity,
    gcTime: Infinity,
    retry: false,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  })

  // While Clerk is still resolving, the query is disabled — which React Query
  // reports as pending-but-not-fetching, i.e. `isLoading === false`. Passing
  // that through would make VicinusBrief skip its skeleton and flash the
  // "brief unavailable" fallback before the real brief lands, so treat the
  // auth-loading window as loading too.
  return { ...query, isLoading: query.isLoading || !isLoaded }
}
