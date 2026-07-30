'use client'

// Fires a CREA DDF `view` analytics event when a listing detail page is viewed
// (Task #2). Side-effect only; renders nothing. The UUID/DestinationId are
// resolved in the analytics client / backend. CREA dedupes by UUID within
// 5-minute windows, so an occasional double-fire (e.g. React strict mode) is
// harmless, but we guard per listingKey anyway.
import { useEffect, useRef } from 'react'
import { logListingEvent } from '@/lib/api/analytics'
import { track } from '@/lib/analytics/capture'

interface ListingViewTrackerProps {
  /** The listing's DDF ListingKey (the property detail route id). */
  listingKey: string
  price?: number | null
  city?: string | null
  beds?: number | null
}

export default function ListingViewTracker({ listingKey, price, city, beds }: ListingViewTrackerProps) {
  const firedFor = useRef<string | null>(null)

  useEffect(() => {
    if (!listingKey || firedFor.current === listingKey) return
    firedFor.current = listingKey
    void logListingEvent({ listingKey, eventType: 'view' })
    track('property_viewed', { listing_key: listingKey, price, city, beds })
  }, [listingKey, price, city, beds])

  return null
}
