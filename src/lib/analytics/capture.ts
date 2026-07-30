// Shared PostHog capture helper — factors out the defensive
// `window.posthog?.capture(...)` pattern first established in
// src/components/realtor-hub/WaitlistForm.tsx (RH-FE-09).
//
// PostHog itself is NOT installed/initialized anywhere in this codebase yet
// (no posthog-js dependency, no init script in layout.tsx) — `window.posthog`
// is a global that doesn't exist today. This is intentionally a guarded
// no-op until that infrastructure lands as a separate initiative: every call
// site stays inert (never throws, never blocks the UI) until then, and
// starts firing automatically the moment PostHog is wired up, with no
// call-site changes required.

// Typed catalogue of every analytics event this app fires (DATA-08). Grouped
// per the analytics plan doc; the "already-shipped ad hoc" group covers raw
// string-literal events that existed at call sites before this wrapper did.
export type VicinusEvent =
  // Lifecycle
  | 'session_started'
  | 'page_viewed'
  | 'signed_up'
  | 'signed_in'
  | 'user_identified'
  // Onboarding
  | 'onboarding_started'
  | 'onboarding_step_viewed'
  | 'onboarding_step_completed'
  | 'onboarding_step_skipped'
  | 'onboarding_completed'
  | 'onboarding_abandoned'
  // Search & discovery
  | 'search_performed'
  | 'filter_applied'
  | 'autocomplete_selected'
  | 'map_moved'
  // Feed & property
  | 'feed_card_impression'
  | 'feed_card_clicked'
  | 'property_viewed'
  | 'property_saved'
  | 'property_unsaved'
  | 'property_media_viewed'
  | 'saved_search_created'
  | 'saved_search_deleted'
  // Conversion
  | 'agent_contact_clicked'
  | 'sell_flow_started'
  | 'sell_step_completed'
  | 'seller_lead_submitted'
  | 'valuation_viewed'
  | 'realtor_connect_requested'
  // Already-shipped ad hoc events
  | 'vibe_check_started'
  | 'vibe_check_question_answered'
  | 'vibe_check_completed'
  | 'vibe_check_shared'
  | 'vibe_check_signup_clicked'
  | 'vibe_check_retake_clicked'
  | 'realtor_waitlist_submitted'

export function capture(event: string, properties?: Record<string, unknown>): void {
  try {
    ;(window as unknown as { posthog?: { capture: (e: string, p?: unknown) => void } }).posthog?.capture(
      event,
      properties
    )
  } catch {
    /* analytics not yet wired */
  }
}

// Typed variant of `capture()` — prefer this at new call sites so event names
// are checked against `VicinusEvent` instead of accepted as arbitrary strings.
export function track(event: VicinusEvent, properties?: Record<string, unknown>): void {
  try {
    ;(window as unknown as { posthog?: { capture: (e: string, p?: unknown) => void } }).posthog?.capture(
      event,
      properties
    )
  } catch {
    /* analytics not yet wired */
  }
}
