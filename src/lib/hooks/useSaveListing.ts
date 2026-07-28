'use client'

// Shared save/unsave logic — used by ActionBar and the PropertyGallery lightbox
// so both stay in sync via the same zustand store instead of duplicating state.
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { useUserStore } from '@/store/userStore'
import { saveProperty, unsaveProperty } from '@/lib/api/users'

export function useSaveListing(propertyId: string) {
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
    } catch {
      setSaveError(true)
      setTimeout(() => setSaveError(false), 4000)
    } finally {
      setSaving(false)
    }
  }

  return { isSaved, saving, saveError, handleSave }
}
