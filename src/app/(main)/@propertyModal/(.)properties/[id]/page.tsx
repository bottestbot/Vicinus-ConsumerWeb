// Intercepts /properties/[id] on client-side navigation and renders it as an
// overlay over whatever the user was browsing (search results + map, feed,
// dashboard). `(.)` matches the same segment level because @propertyModal is a
// slot, not a route segment. Hard navigations fall through to
// app/(main)/properties/[id]/page.tsx.
import PropertyDetailView from '@/components/property/PropertyDetailView'

export default async function InterceptedPropertyDetail({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  // Next.js 16: params is a Promise — must be awaited
  const { id } = await params
  return <PropertyDetailView id={id} />
}
