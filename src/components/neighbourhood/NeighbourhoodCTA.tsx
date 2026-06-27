import Link from 'next/link'

interface Props {
  name: string
  slug: string
}

export default function NeighbourhoodCTA({ name, slug }: Props) {
  return (
    <section className="mt-10 rounded-2xl bg-[#1C3829] px-8 py-14 text-center">
      <p className="text-white/60 text-xs font-semibold uppercase tracking-widest mb-3 font-ui">
        Start Your Journey
      </p>
      <h2 className="font-heading text-3xl lg:text-4xl font-bold text-white mb-8">
        Make {name} your home?
      </h2>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <Link
          href={`/search?neighbourhood=${slug}`}
          className="inline-flex items-center justify-center px-7 py-3 bg-white text-[#1C3829] text-sm font-semibold rounded-xl hover:bg-[#FAF9F6] transition-colors"
        >
          Explore Listings
        </Link>
        <Link
          href={`/sign-up?intent=tour&neighbourhood=${slug}`}
          className="inline-flex items-center justify-center px-7 py-3 border border-white/40 text-white text-sm font-semibold rounded-xl hover:border-white/70 hover:bg-white/5 transition-colors"
        >
          Connect with neighbourhood expert
        </Link>
      </div>
    </section>
  )
}
