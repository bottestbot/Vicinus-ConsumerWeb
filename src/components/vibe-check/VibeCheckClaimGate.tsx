'use client'

import { useEffect, useRef } from 'react'
import { useAuth } from '@clerk/nextjs'
import { claimVibeCheck } from '@/lib/api/vibe-check'
import { peekVibeSessionId } from '@/lib/vibe-check/session'

// Post-signup merge (PRD §8/§9) — mounted on the result page alongside
// VibeCheckResultCard. Whenever a signed-in user has a local vibe-check
// sessionId, fires the claim call so any anonymous result(s) from that
// session get attached to their account. Unlike OnboardingGate's
// vibeAuthReturn one-shot flag, this has no gating: /vibe-check/claim is
// idempotent server-side, so it's safe (and correct) to fire on every visit —
// e.g. a returning signed-in user who retook the quiz anonymously on the same
// device should still get the new result claimed. Deliberately a separate
// concern from vibeAuthReturn/OnboardingGate — don't fold this into that flag,
// they run independently and shouldn't race or depend on one another.
export default function VibeCheckClaimGate() {
  const { isSignedIn, isLoaded } = useAuth()
  const claimed = useRef(false)

  useEffect(() => {
    if (!isLoaded || !isSignedIn || claimed.current) return
    const sessionId = peekVibeSessionId()
    if (!sessionId) return

    claimed.current = true
    claimVibeCheck(sessionId).catch(() => {
      // Silently ignore — never block the result page on this.
    })
  }, [isLoaded, isSignedIn])

  return null
}
