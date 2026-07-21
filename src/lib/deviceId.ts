// Stable per-device identifier used for CREA DDF analytics (Task #2).
// CREA's LogEvents service expects a UUID that is consistent across all events
// from a single user/device so it can dedupe (5-minute windows) and attribute
// activity. We persist a random GUID in localStorage; the backend appends the
// DestinationId before forwarding to CREA.

const STORAGE_KEY = 'vic_device_id'

/** Returns a stable device UUID, creating and persisting one on first use.
 *  Returns null during SSR (no localStorage) so callers can no-op server-side. */
export function getDeviceId(): string | null {
  if (typeof window === 'undefined') return null
  try {
    let id = window.localStorage.getItem(STORAGE_KEY)
    if (!id) {
      id =
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2)}`
      window.localStorage.setItem(STORAGE_KEY, id)
    }
    return id
  } catch {
    // Private mode / storage disabled — analytics is best-effort, so skip.
    return null
  }
}
