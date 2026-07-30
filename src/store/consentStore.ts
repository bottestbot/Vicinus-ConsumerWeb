import { create } from 'zustand'

type ConsentStatus = 'pending' | 'accepted' | 'rejected'

interface ConsentStore {
  status: ConsentStatus
  accept: () => void
  reject: () => void
}

const CONSENT_COOKIE_NAME = 'vicinus_consent'

// Reads the first-party consent cookie. Guarded for SSR — `create` runs on
// both server and client in Next, and `document` doesn't exist on the server.
function readConsentCookie(): ConsentStatus {
  if (typeof document === 'undefined') return 'pending'

  const match = document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${CONSENT_COOKIE_NAME}=`))

  const value = match?.split('=')[1]
  if (value === 'accepted' || value === 'rejected') return value
  return 'pending'
}

function writeConsentCookie(value: 'accepted' | 'rejected') {
  if (typeof document === 'undefined') return
  document.cookie = `${CONSENT_COOKIE_NAME}=${value}; path=/; max-age=31536000; SameSite=Lax`
}

// PIPEDA consent gate for analytics. Status starts from the first-party
// `vicinus_consent` cookie so a returning visitor's choice persists without
// re-prompting; the PostHog init (separate workstream) reads `status` to
// decide whether to fire.
export const useConsentStore = create<ConsentStore>((set) => ({
  status: readConsentCookie(),
  accept: () => {
    writeConsentCookie('accepted')
    set({ status: 'accepted' })
  },
  reject: () => {
    writeConsentCookie('rejected')
    set({ status: 'rejected' })
  },
}))
