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
