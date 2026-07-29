'use client'

// Shared popover shell used by FilterPanel's dropdown (and, later, other
// search-bar popovers). Desktop keeps the original absolute-anchored panel;
// mobile swaps to a body-portaled bottom sheet so it can't be clipped by an
// `overflow-hidden` ancestor (e.g. SearchPageClient's map/list container).
//
// Dismissal is owned here so every popover behaves the same: a click outside
// both the panel and its trigger closes it.

import { useEffect } from 'react'
import { Dialog } from '@base-ui/react/dialog'
import { glass, type GlassTheme } from './glassTheme'

export default function ResponsivePopover({
  open,
  onClose,
  theme,
  children,
  anchorRef,
  desktopClassName = '',
}: {
  open: boolean
  onClose: () => void
  theme: GlassTheme
  children: React.ReactNode
  /** Wrapper around the trigger — clicks inside it don't count as "outside",
   *  so the trigger's own onClick owns the toggle. */
  anchorRef?: React.RefObject<HTMLElement | null>
  desktopClassName?: string
}) {
  // Close on outside click. The mobile sheet is portaled to <body>, so it is
  // never a DOM descendant of the anchor — hence the data-attribute check,
  // which matches whichever surface is currently rendered.
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      const target = e.target as Element | null
      if (anchorRef?.current?.contains(target ?? null)) return
      if (target?.closest('[data-responsive-popover]')) return
      onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open, onClose, anchorRef])

  if (!open) return null

  const t = glass(theme)

  return (
    <>
      {/* Desktop / tablet — original absolute-anchored panel, unchanged. */}
      <div
        data-responsive-popover=""
        className={[
          'hidden sm:block absolute top-full right-0 mt-2 w-[360px] max-w-[calc(100vw-2rem)] rounded-2xl z-[100]',
          'max-h-[70vh] overflow-y-auto',
          t.surface,
          t.text,
          desktopClassName,
        ].join(' ')}
      >
        {children}
      </div>

      {/* Mobile — body-portaled bottom sheet, escapes any overflow-hidden ancestor.
          Note: Dialog.Portal renders Backdrop/Popup into document.body, so they
          are no longer DOM descendants of this component — the `sm:hidden` /
          `sm:block` breakpoint classes must live directly on the portaled
          elements themselves, not on a wrapper here. */}
      <Dialog.Root open={open} onOpenChange={(v) => !v && onClose()}>
        <Dialog.Portal>
          <Dialog.Backdrop className="sm:hidden fixed inset-0 z-[100] bg-black/30" />
          <Dialog.Popup
            data-responsive-popover=""
            className={[
              'sm:hidden fixed inset-x-0 bottom-0 z-[100] rounded-t-2xl',
              'max-h-[85vh] overflow-y-auto pb-[env(safe-area-inset-bottom)]',
              t.surface,
              t.text,
              // desktopClassName is deliberately NOT applied here — it carries
              // desktop widths (e.g. w-[340px]) that would fight inset-x-0 and
              // leave the sheet short of the screen edge.
            ].join(' ')}
          >
            {children}
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  )
}
