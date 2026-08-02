'use client'

// Zillow-style property panel. Both surfaces that render the detail use this
// shell, so the listing always lives in the same card:
//
//   • overlay — app/(main)/@propertyModal/(.)properties/[id] intercepts a
//     client-side navigation to /properties/[id] and floats the card over the
//     search results/map (or feed, or dashboard) the user was browsing.
//   • page    — app/(main)/properties/[id] is what a refresh, a pasted link or
//     a crawler gets, because interception only fires on a soft navigation.
//
// The page used to render full-bleed, so a refresh visibly ejected the user out
// of the panel they were reading mid-scroll. There is nothing to put behind the
// card on a hard load — the map/results/filters live in the client-side
// searchStore and don't survive it — so the page variant keeps the card and
// drops the parts that only make sense over a live surface: it sits below the
// navbar instead of covering it, uses the site's own surface instead of a scrim
// (a dark scrim over an empty document reads as a broken modal), and doesn't
// claim to be a modal dialog. A reload now only lightens the surround.
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, X } from 'lucide-react'
import { useLightboxStore } from '@/store/lightboxStore'

export type PropertyPanelVariant = 'overlay' | 'page'

export default function PropertyDetailPanel({
  children,
  variant = 'overlay',
}: {
  children: React.ReactNode
  variant?: PropertyPanelVariant
}) {
  const router = useRouter()
  const isOverlay = variant === 'overlay'

  // Resolved on click rather than at render so the two variants server-render
  // identically — nothing here can cause a hydration mismatch.
  const close = () => {
    // The overlay only ever mounts on a client-side navigation, so the entry
    // behind it is the surface the user came from (search, feed, dashboard…);
    // back() restores it with its scroll position intact.
    if (isOverlay) return router.back()

    // Hard load. A reload keeps the history stack, so back() still lands on
    // whatever the overlay was opened over. A cold deep-link (pasted URL,
    // Google result, shared link) has nothing of ours behind it, and back()
    // would either no-op or eject the user off-site — send those to the
    // listings instead so "Back" is never a dead button.
    const [nav] = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[]
    if (nav?.type !== 'navigate' && window.history.length > 1) return router.back()
    router.push('/search')
  }

  useEffect(() => {
    // Escape is a dismiss-the-dialog affordance, so it belongs to the overlay
    // only — on the page there is no dialog to dismiss, and hijacking the key
    // to navigate away from a listing the user came to read is a footgun.
    const onKeyDown = (e: KeyboardEvent) => {
      if (!isOverlay || e.key !== 'Escape' || e.defaultPrevented) return
      // The gallery's fullscreen lightbox portals above this panel, so Escape
      // belongs to it while it's open — otherwise one keypress would blow past
      // the photos and dump the user back on the search results. Read the store
      // imperatively so the listener never needs re-binding.
      if (useLightboxStore.getState().isOpen) return
      close()
    }
    document.addEventListener('keydown', onKeyDown)

    // The detail scrolls inside the panel in both variants, so freeze the
    // document behind it — on the page that's the navbar and the site footer,
    // which would otherwise slide up under a card that can't move with them.
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div
      // aria-modal would hide the rest of the document from assistive tech —
      // correct over a live surface, wrong on the page, where the navbar beside
      // the card is the only navigation the user has.
      {...(isOverlay
        ? { role: 'dialog' as const, 'aria-modal': true, 'aria-label': 'Property details' }
        : {})}
      className={[
        'fixed flex justify-center sm:py-[2vh]',
        isOverlay
          ? 'inset-0 z-[150] bg-black/55 backdrop-blur-[2px] animate-in fade-in duration-200'
          : // top-16 clears the sticky navbar (h-16) so the site stays
            // navigable; z-40 keeps the card under that navbar's own z-50.
            'inset-x-0 bottom-0 top-16 z-40 bg-[#E8E6E1]',
      ].join(' ')}
      onMouseDown={(e) => {
        // mousedown (not click) on the backdrop only — a text selection that
        // starts inside the panel and ends on the backdrop must not close it.
        // The page variant has no backdrop to speak of: clicking the surround
        // is not a dismiss gesture when nothing is being dismissed.
        if (isOverlay && e.target === e.currentTarget) close()
      }}
    >
      <div className="relative flex h-full w-full max-w-[1100px] flex-col overflow-hidden bg-[#FAF9F6] shadow-2xl sm:rounded-2xl">
        {/* ── Panel chrome — identical in both variants so a reload doesn't
            visibly reshuffle the controls under the user's cursor ────────── */}
        <div className="flex shrink-0 items-center justify-between border-b border-[#E8E6E1] bg-white/95 px-4 py-3 backdrop-blur sm:px-6">
          <button
            onClick={close}
            className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium text-[#111111] transition-colors hover:bg-[#F2F0EB]"
          >
            <ChevronLeft size={17} />
            Back
          </button>
          <button
            onClick={close}
            aria-label="Close property details"
            className="rounded-lg p-1.5 text-[#6B6B6B] transition-colors hover:bg-[#F2F0EB] hover:text-[#111111]"
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Scrollable detail ─────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto overscroll-contain">{children}</div>
      </div>
    </div>
  )
}
