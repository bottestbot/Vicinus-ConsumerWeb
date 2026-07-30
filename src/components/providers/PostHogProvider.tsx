'use client'

import { Suspense, useEffect, useRef } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import posthog from 'posthog-js'
import { useConsentStore } from '@/store/consentStore'

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://eu.i.posthog.com'

/**
 * Captures a `page_viewed` event on every route change (pathname or query
 * string). `useSearchParams` requires a Suspense boundary in the App Router,
 * so this piece is isolated from the rest of the provider and wrapped below.
 */
function PostHogPageView() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (!POSTHOG_KEY) return

    const query = searchParams.toString()
    const url = query ? `${pathname}?${query}` : pathname

    posthog.capture('page_viewed', { path: pathname, url })
  }, [pathname, searchParams])

  return null
}

/**
 * Reacts to consent changes and identifies the signed-in Clerk user.
 * Split out from the pageview tracker so it doesn't need a Suspense
 * boundary.
 */
function PostHogConsentAndIdentity() {
  const status = useConsentStore((s) => s.status)
  const { isSignedIn, user } = useUser()

  useEffect(() => {
    if (!POSTHOG_KEY) return

    if (status === 'accepted') {
      posthog.opt_in_capturing()
    } else if (status === 'rejected') {
      posthog.opt_out_capturing()
    }
  }, [status])

  useEffect(() => {
    if (!POSTHOG_KEY) return
    if (!isSignedIn || !user?.id) return
    if (posthog.get_distinct_id() === user.id) return

    posthog.identify(user.id)
  }, [isSignedIn, user?.id])

  return null
}

/**
 * Initializes PostHog once on mount. Guarded no-op when
 * NEXT_PUBLIC_POSTHOG_KEY isn't set, matching the same
 * guarded-no-op philosophy as src/lib/analytics/capture.ts.
 *
 * Capturing is opted out by default and only turned on once PIPEDA consent
 * is recorded via the consent store (see useConsentStore in
 * PostHogConsentAndIdentity below) — including on this initial mount, in
 * case consent was already given in a prior session.
 */
export default function PostHogProvider({ children }: { children: React.ReactNode }) {
  const initialized = useRef(false)

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    if (!POSTHOG_KEY) return

    posthog.init(POSTHOG_KEY, {
      api_host: POSTHOG_HOST,
      person_profiles: 'identified_only',
      opt_out_capturing_by_default: true,
      // 'history_change' (not `false`) so posthog-js autocaptures its own
      // $pageview/$pageleave on client-side route changes — PostHog's built-in
      // Web Analytics product (traffic/sessions/page-report UI) is hardcoded
      // to those reserved event names and shows nothing without them. Our own
      // `page_viewed` capture below is a separate, additional custom event for
      // the analytics taxonomy/dashboards — not a replacement for this.
      capture_pageview: 'history_change',
    })

    // src/lib/analytics/capture.ts (and every existing track()/capture() call
    // site) reads the global `window.posthog`, not the posthog-js module
    // import — that global is only auto-set by the <script>-snippet loader,
    // not by `import posthog from 'posthog-js'`. Expose it explicitly so
    // those call sites actually fire instead of silently no-op-ing.
    ;(window as unknown as { posthog?: typeof posthog }).posthog = posthog

    const status = useConsentStore.getState().status
    if (status === 'accepted') {
      posthog.opt_in_capturing()
    } else if (status === 'rejected') {
      posthog.opt_out_capturing()
    }
  }, [])

  return (
    <>
      <Suspense fallback={null}>
        <PostHogPageView />
      </Suspense>
      <PostHogConsentAndIdentity />
      {children}
    </>
  )
}
