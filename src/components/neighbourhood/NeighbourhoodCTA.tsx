import Link from 'next/link'

interface Props {
  name: string
  slug: string
  lat?: number
  lng?: number
}

// NBHDCTA-02: scope the search page to this neighbourhood by centroid, not just
// the slug — the search page has no notion of a "neighbourhood", so it needs
// lat/lng (to box the results) and a label to show instead of falling back to
// the browsing default. `neighbourhood`/`name` are also included for context.
export default function NeighbourhoodCTA({ name, slug, lat, lng }: Props) {
  const params = new URLSearchParams({ neighbourhood: slug, name })
  if (lat != null && lng != null) {
    params.set('lat', String(lat))
    params.set('lng', String(lng))
  }

  return (
    <section className="mt-10 rounded-2xl bg-[#1C3829] px-8 py-14 text-center">
      <p className="text-white/60 text-xs font-semibold uppercase tracking-widest mb-3 font-ui">
        Start Your Journey
      </p>
      <h2 className="font-heading text-3xl lg:text-4xl font-bold text-white mb-8">
        Make {name} your home?
      </h2>
      <div className="flex items-center justify-center">
        <Link
          href={`/search?${params.toString()}`}
          className="inline-flex items-center justify-center px-7 py-3 bg-white text-[#1C3829] text-sm font-semibold rounded-xl hover:bg-[#FAF9F6] transition-colors"
        >
          Explore Listings
        </Link>
      </div>
    </section>
  )
}
