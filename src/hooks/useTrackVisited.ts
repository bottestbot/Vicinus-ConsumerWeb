'use client'

// FE-412: Track visited property on page load
import { useEffect } from 'react'
import { trackVisited } from '@/lib/api/users'

export function useTrackVisited(propertyId: string) {
  useEffect(() => {
    if (!propertyId) return
    trackVisited(propertyId).catch(() => {
      // Non-critical — silently ignore errors (e.g. not signed in)
    })
  }, [propertyId])
}
