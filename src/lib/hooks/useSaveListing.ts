'use client'

// Shared save/unsave logic — used by ActionBar and the PropertyGallery lightbox
// so both stay in sync via the same zustand store instead of duplicating state.
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { useUserStore } from '@/store/userStore'
import { saveProperty, unsaveProperty } from '@/lib/api/users'
import { track } from '@/lib/analytics/capture'

// `surface` identifies where the save toggle lives for analytics — defaults to
// the detail page's ActionBar, the original (and still primary) caller.
export function useSaveListing(propertyId: string, surface: string = 'detail_page') {
  const { isSignedIn } = useUser()
  const { savedPropertyIds, toggleSaved } = useUserStore()
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(false)
  const router = useRouter()

  const isSaved = savedPropertyIds.has(propertyId)

  async function handleSave() {
    if (!isSignedIn) {
      router.push(`/sign-in?redirect=/properties/${propertyId}`)
      return
    }
    setSaving(true)
    setSaveError(false)
    try {
      if (isSaved) {
        await unsaveProperty(propertyId)
      } else {
        await saveProperty(propertyId)
      }
      // Only reflect the new state once the backend has actually persisted it —
      // toggling on failure previously made the button lie (showed "Saved" even
      // when the write failed), which is why saves could go missing from the
      // dashboard with no indication anything went wrong.
      toggleSaved(propertyId)
      track(isSaved ? 'property_unsaved' : 'property_saved', { listing_key: propertyId, surface })
    } catch {
      setSaveError(true)
      setTimeout(() => setSaveError(false), 4000)
    } finally {
      setSaving(false)
    }
  }

  return { isSaved, saving, saveError, handleSave }
}
