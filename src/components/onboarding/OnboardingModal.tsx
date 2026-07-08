'use client'

import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { useOnboardingStore } from '@/store/onboardingStore'
import OnboardingWizard from './OnboardingWizard'

// Global onboarding modal — rendered once from the root layout. The wizard is a
// tall multi-step form, so it lives in a scrollable overlay capped to the
// viewport. Opening is driven by OnboardingGate; dismissing (backdrop, Escape,
// close button, Skip/Save & Exit) closes WITHOUT marking onboarding complete,
// so the server re-prompts on the next 5th login-session. Completing marks it
// done and closes.
export default function OnboardingModal() {
  const isOpen = useOnboardingStore((s) => s.isOpen)
  const close = useOnboardingStore((s) => s.close)
  const panelRef = useRef<HTMLDivElement>(null)

  // Lock body scroll, close on Escape, and trap focus within the panel.
  useEffect(() => {
    if (!isOpen) return

    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const prevActive = document.activeElement as HTMLElement | null

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        close()
        return
      }
      if (e.key !== 'Tab') return
      const panel = panelRef.current
      if (!panel) return
      const focusable = panel.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])',
      )
      if (focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    // Move focus into the panel for keyboard/screen-reader users.
    panelRef.current?.focus()

    return () => {
      document.body.style.overflow = prevOverflow
      document.removeEventListener('keydown', onKeyDown)
      prevActive?.focus?.()
    }
  }, [isOpen, close])

  if (!isOpen) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Personalize your Vicinus experience"
      className="fixed inset-0 z-[100] flex items-center justify-center p-0 sm:p-4"
    >
      {/* Backdrop — click to dismiss */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={close}
        aria-hidden="true"
      />

      {/* Panel — the wizard uses min-h-screen internally, so cap it to the
          viewport and let it scroll. */}
      <div
        ref={panelRef}
        tabIndex={-1}
        className="relative z-10 w-full max-w-5xl h-full sm:h-[90vh] sm:max-h-[900px] overflow-hidden sm:rounded-2xl bg-[#F5F3EE] shadow-2xl outline-none"
      >
        <button
          onClick={close}
          aria-label="Dismiss"
          className="absolute right-4 top-4 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-[#6B6B6B] shadow-sm hover:text-[#111111] transition-colors"
        >
          <X size={18} />
        </button>

        {/* Inner scroll container. The wizard's steps use min-h-screen layouts,
            so they render at full height and scroll within this capped box. */}
        <div className="h-full overflow-y-auto">
          <OnboardingWizard onComplete={close} onSkip={close} />
        </div>
      </div>
    </div>
  )
}
