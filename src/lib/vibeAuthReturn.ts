// One-shot suppression for OnboardingGate's post-signup return trip from the
// vibe check quiz (see NEIGHBOURHOOD_VIBE_CHECK_PRD.md §9). The quiz's
// "sign up to unlock more matches" CTA calls markVibeAuthReturn() right before
// sending the user to Clerk; OnboardingGate consumes it on its very next mount
// to skip popping the modal over the result page. sessionStorage (not a
// cookie or path check) means a later, unrelated session landing on /vibe
// gets normal onboarding behaviour — this only ever fires once per flag set.
const KEY = 'vicinus:vibe-auth-return'

export function markVibeAuthReturn(): void {
  try {
    window.sessionStorage.setItem(KEY, '1')
  } catch {
    // sessionStorage full/blocked — non-fatal, worst case onboarding pops once.
  }
}

export function consumeVibeAuthReturn(): boolean {
  try {
    const flag = window.sessionStorage.getItem(KEY)
    if (!flag) return false
    window.sessionStorage.removeItem(KEY)
    return true
  } catch {
    return false
  }
}
