'use client'

// Shared popover shell used by FilterPanel's dropdown (and, later, other
// search-bar popovers). Desktop keeps the original absolute-anchored panel;
// mobile swaps to a body-portaled bottom sheet so it can't be clipped by an
// `overflow-hidden` ancestor (e.g. SearchPageClient's map/list container).

import { Dialog } from '@base-ui/react/dialog'
import { glass, type GlassTheme } from './glassTheme'

export default function ResponsivePopover({
  open,
  onClose,
  theme,
  children,
  desktopClassName = '',
}: {
  open: boolean
  onClose: () => void
  theme: GlassTheme
  children: React.ReactNode
  desktopClassName?: string
}) {
  if (!open) return null

  const t = glass(theme)

  return (
    <>
      {/* Desktop / tablet — original absolute-anchored panel, unchanged. */}
      <div
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
            className={[
              'sm:hidden fixed inset-x-0 bottom-0 z-[100] rounded-t-2xl',
              'max-h-[85vh] overflow-y-auto pb-[env(safe-area-inset-bottom)]',
              t.surface,
              t.text,
              desktopClassName,
            ].join(' ')}
          >
            {children}
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  )
}
