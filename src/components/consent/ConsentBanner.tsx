'use client'

import { useConsentStore } from '@/store/consentStore'
import { Button } from '@/components/ui/button'

// PIPEDA cookie consent bar (DATA-02). A fixed bottom bar, not a modal — no
// backdrop, doesn't block the page. Gates analytics (PostHog init is a
// separate workstream that reads `status` off useConsentStore).
export default function ConsentBanner() {
  const status = useConsentStore((s) => s.status)
  const accept = useConsentStore((s) => s.accept)
  const reject = useConsentStore((s) => s.reject)

  if (status !== 'pending') return null

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-[#E5E1D8] bg-[#FAF9F6] px-4 py-4 sm:px-6">
      <div className="mx-auto flex max-w-5xl flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
        <p className="text-sm text-[#3A3A3A]">
          We use cookies to understand how you use Vicinus and improve your
          experience. Read our{' '}
          <a
            href="/privacy"
            className="text-[#1C3829] underline underline-offset-2 hover:text-[#111111]"
          >
            Privacy Policy
          </a>
          .
        </p>
        <div className="flex shrink-0 gap-2">
          <Button variant="outline" size="sm" onClick={reject}>
            Reject
          </Button>
          <Button size="sm" onClick={accept}>
            Accept
          </Button>
        </div>
      </div>
    </div>
  )
}
