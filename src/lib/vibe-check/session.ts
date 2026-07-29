// Anonymous session id for the Neighbourhood Vibe Check quiz (PRD §8-9). The
// quiz works fully logged out, so results are tied to a client-generated
// `sessionId` rather than a userId. Persisted in localStorage (not
// sessionStorage) — unlike useBrief.ts's per-tab cache, this id must survive
// a closed tab/browser restart so a later signup-from-quiz merge step (not
// part of this task; see PRD §8) has something stable to match against.
//
// Same key/value is read on every screen of the quiz (landing -> 11
// questions -> submit), so it's created once on first visit and reused for
// the rest of the flow.
const SESSION_KEY = 'vicinus:vibe-session-id'

function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  // Extremely old browser fallback — good enough for an anonymous, low-stakes id.
  return `vibe-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

/**
 * Reads the persisted vibe-check session id, creating and storing one on
 * first call. Safe to call repeatedly across the quiz's screens — always
 * returns the same value for the life of the browser's localStorage.
 */
export function getOrCreateVibeSessionId(): string {
  if (typeof window === 'undefined') return ''
  try {
    const existing = window.localStorage.getItem(SESSION_KEY)
    if (existing) return existing
    const fresh = generateId()
    window.localStorage.setItem(SESSION_KEY, fresh)
    return fresh
  } catch {
    // localStorage blocked (private mode/quota/disabled) — fall back to an
    // in-memory id so the quiz still works for this page load, just without
    // cross-visit persistence.
    return generateId()
  }
}
