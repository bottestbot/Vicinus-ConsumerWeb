'use client'
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@clerk/nextjs'
import { useEffect, useRef, useState } from 'react'
import { BRIEF_SESSION_PREFIX } from '@/hooks/useBrief'

// Anything under these prefixes is personalized and must not outlive the
// account that produced it. sessionStorage survives a client-side sign-out on
// its own, so scoping the keys by user id isn't enough — the previous
// account's entries have to actually go.
const USER_SCOPED_STORAGE_PREFIXES = [BRIEF_SESSION_PREFIX]

/**
 * Drops every cached per-user response when the signed-in identity changes.
 *
 * Sign-in, sign-out and account switching are all client-side transitions that
 * leave the QueryClient — and any sessionStorage written alongside it — fully
 * intact. Without this, the next account in the same tab can be served the
 * previous one's personalized data (the IQ Brief did exactly that: its counts
 * and the addresses it named were replayed to brand-new accounts).
 */
function AuthCacheBoundary({ children }: { children: React.ReactNode }) {
  const { isLoaded, userId } = useAuth()
  const queryClient = useQueryClient()
  // `undefined` means "no identity observed yet", which distinguishes the first
  // paint of a normal signed-in load (don't wipe) from a real transition (wipe).
  const previousUserId = useRef<string | null | undefined>(undefined)

  useEffect(() => {
    if (!isLoaded) return

    if (previousUserId.current !== undefined && previousUserId.current !== userId) {
      // Covers in-memory per-user queries (brief, open-house visits, saved
      // properties) in one shot. Non-personalized entries get evicted too and
      // simply refetch — cheaper than enumerating which keys are user-bound.
      queryClient.clear()

      try {
        // Object.keys snapshots first, so removing while iterating is safe.
        for (const key of Object.keys(window.sessionStorage)) {
          if (USER_SCOPED_STORAGE_PREFIXES.some((prefix) => key.startsWith(prefix))) {
            window.sessionStorage.removeItem(key)
          }
        }
      } catch {
        // sessionStorage blocked (private mode/quota) — the cache clear above
        // still applies, and the keys are user-scoped as a second line anyway.
      }
    }

    previousUserId.current = userId
  }, [isLoaded, userId, queryClient])

  return <>{children}</>
}

export default function QueryProvider({ children }: { children: React.ReactNode }) {
  const [client] = useState(() => new QueryClient({
    defaultOptions: { queries: { staleTime: 60_000 } },
  }))
  return (
    <QueryClientProvider client={client}>
      <AuthCacheBoundary>{children}</AuthCacheBoundary>
    </QueryClientProvider>
  )
}
