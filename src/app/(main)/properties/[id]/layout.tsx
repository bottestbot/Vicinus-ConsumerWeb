// Interception only fires on a soft navigation, so a refresh or a pasted link
// lands here instead of on the overlay — and used to swap the panel the user
// was reading for a full-bleed page. This wraps the same <PropertyDetailPanel>
// the intercepting route uses (variant="page": below the navbar, no scrim, no
// dialog semantics), so the card survives the reload.
//
// It's a layout, not part of page.tsx, for the same reason the intercepted
// route does it that way: loading.tsx then streams *inside* the panel, so the
// chrome is painted before the listing resolves.
import PropertyDetailPanel from '@/components/property/PropertyDetailPanel'

export default function PropertyDetailLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <PropertyDetailPanel variant="page">{children}</PropertyDetailPanel>
}
