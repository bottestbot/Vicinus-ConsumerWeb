'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'
import { pingSession } from '@/lib/api/users'
import { useOnboardingStore } from '@/store/onboardingStore'

// Fires once per page load for signed-in users. Records the login-SESSION on the
// backend (the ping only bumps loginCount when the Clerk session id changes) and,
// when the server says showOnboarding is true, opens the global onboarding modal
// over the current route. showOnboarding follows the re-prompt cadence — shown on
// login-sessions 1, 6, 11, 16… until onboarding is completed.
export default function OnboardingGate() {
  const { isSignedIn, isLoaded } = useAuth()
  const pathname = usePathname()
  const open = useOnboardingStore((s) => s.open)
  const isOpen = useOnboardingStore((s) => s.isOpen)
  const pinged = useRef(false)

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return
    if (pinged.current) return
    // The standalone /onboarding route renders the wizard itself — don't also
    // pop the modal on top of it.
    if (pathname.startsWith('/onboarding')) return

    pinged.current = true

    pingSession()
      .then(({ data }) => {
        // Guard against opening on top of an already-open modal.
        if (data.showOnboarding && !useOnboardingStore.getState().isOpen) {
          open()
        }
      })
      .catch(() => {
        // Silently ignore — never block the user
      })
  }, [isLoaded, isSignedIn, pathname, open, isOpen])

  return null
}
