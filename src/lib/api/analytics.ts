// CREA DDF analytics client (Task #2 / #6). Reports listing view / click /
// email_realtor events to the backend, which appends the DestinationId and
// forwards to CREA's LogEvents service. Fire-and-forget: never throws, never
// blocks UI. Required of a Real Estate Advertising Website on the National
// Shared Pool.
import apiClient from './client'
import { getDeviceId } from '@/lib/deviceId'

export type ListingEventType = 'view' | 'Click' | 'email_realtor'

interface LogListingEventArgs {
  /** DDF ListingKey of the listing the event is about. */
  listingKey: string
  eventType: ListingEventType
  /** 1 = English, 2 = French. */
  languageId?: 1 | 2
}

/** Report a listing analytics event. Best-effort — resolves even on failure. */
export async function logListingEvent({
  listingKey,
  eventType,
  languageId,
}: LogListingEventArgs): Promise<void> {
  const uuid = getDeviceId()
  if (!uuid || !listingKey) return

  try {
    await apiClient.post('/analytics/listing-event', {
      listingKey,
      eventType,
      uuid,
      referralUrl: typeof window !== 'undefined' ? window.location.href : undefined,
      languageId,
    })
  } catch {
    // Analytics must never surface to the user.
  }
}
