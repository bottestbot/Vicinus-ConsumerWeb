'use client'

import { useEffect, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'
import { pingSession } from '@/lib/api/users'

// Fires once per page load for signed-in users.
// Increments loginCount on the backend and redirects to /onboarding
// when the server says showOnboarding = true (odd login + not completed).
export default function OnboardingGate() {
  const { isSignedIn, isLoaded } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const pinged = useRef(false)

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return
    if (pinged.current) return
    if (pathname.startsWith('/onboarding')) return

    pinged.current = true

    pingSession()
      .then(({ data }) => {
        if (data.showOnboarding) {
          router.push('/onboarding')
        }
      })
      .catch(() => {
        // Silently ignore — never block the user
      })
  }, [isLoaded, isSignedIn, pathname, router])

  return null
}
