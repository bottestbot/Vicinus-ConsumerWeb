// Wrapping the panel chrome in a layout (rather than the page) means
// loading.tsx streams *inside* the panel — the overlay opens instantly on click
// and fills in, instead of the click hanging until the listing resolves.
// app/(main)/properties/[id]/layout.tsx mirrors this for the hard-load page.
import PropertyDetailPanel from '@/components/property/PropertyDetailPanel'

export default function InterceptedPropertyLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <PropertyDetailPanel variant="overlay">{children}</PropertyDetailPanel>
}
