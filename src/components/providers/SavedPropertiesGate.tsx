'use client'

import { useEffect, useRef } from 'react'
import { useAuth } from '@clerk/nextjs'
import { getSavedProperties } from '@/lib/api/users'
import { useUserStore } from '@/store/userStore'

// Hydrates the client-side savedPropertyIds store once per sign-in so Save
// buttons (ActionBar, MapListingPopup) reflect true saved state instead of
// always starting empty and showing "Save" for listings the user already saved.
export default function SavedPropertiesGate() {
  const { isSignedIn, isLoaded } = useAuth()
  const setSaved = useUserStore((s) => s.setSaved)
  const hydrated = useRef(false)

  useEffect(() => {
    if (!isLoaded) return
    if (!isSignedIn) {
      hydrated.current = false
      return
    }
    if (hydrated.current) return
    hydrated.current = true

    getSavedProperties()
      .then(({ data }) => {
        const ids = Array.isArray(data) ? data.map((r: { propertyId: string }) => r.propertyId) : []
        setSaved(ids)
      })
      .catch(() => {
        // Non-fatal — buttons just fall back to unhydrated (unsaved-looking) state.
      })
  }, [isLoaded, isSignedIn, setSaved])

  return null
}
