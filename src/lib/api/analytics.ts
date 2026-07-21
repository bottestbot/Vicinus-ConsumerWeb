// CREA DDF analytics client (Task #2 / #6). Reports listing view / click /
// email_realtor events to the backend, which appends the DestinationId and
// forwards to CREA's LogEvents service. Fire-and-forget: never throws, never
// blocks UI. Required of a Real Estate Advertising Website on the National
// Shared Pool.
import apiClient from './client'

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
  if (!listingKey || typeof window === 'undefined') return

  try {
    await apiClient.post(
      '/analytics/listing-event',
      {
        listingKey,
        eventType,
        referralUrl: window.location.href,
        languageId,
      },
      // CREA-02: the visitor identity is a signed HttpOnly cookie issued by the
      // API, so this request must carry credentials. We no longer send a
      // client-generated uuid — a caller-chosen id can be rotated to defeat
      // CREA's 5-minute dedup window.
      { withCredentials: true },
    )
  } catch {
    // Analytics must never surface to the user.
  }
}

/**
 * CREA-05: click-through on a listing card. Fired when a user opens a listing
 * from search, feed, map or a dashboard card — the REAW tier requires
 * click reporting, not just impressions.
 */
export function logListingClick(listingKey: string): void {
  void logListingEvent({ listingKey, eventType: 'Click' })
}

/**
 * CREA-05: a lead sent to the listing REALTOR®. Fired when the user acts on
 * the agent contact CTA.
 */
export function logEmailRealtor(listingKey: string): void {
  void logListingEvent({ listingKey, eventType: 'email_realtor' })
}
