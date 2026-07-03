import Image from 'next/image'

const FEATURES = [
  {
    title: 'Augmented Neighbourhood Data',
    body: 'See more than the listing. Get enriched, hyperlocal data on every neighbourhood you work — the context your clients are already asking for.',
    image:
      'https://images.unsplash.com/photo-1526628953301-3e589a6a8b74?w=800&q=80',
    alt: 'Data visualization dashboard',
  },
  {
    title: 'Neighbourhood Bidding',
    body: 'Know where demand is building before it shows up in the numbers. Access aggregate buyer intent by area, so you can prioritize where to spend your time.',
    image:
      'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80',
    alt: 'Analytics and buyer intent chart',
  },
  {
    title: 'Short-Form Listing Content',
    body: 'Bring your listings to life. Add short-form video and content directly to your listings on Vicinus — no extra platform, no extra login.',
    image:
      'https://images.unsplash.com/photo-1512428559087-560fa5ceab42?w=800&q=80',
    alt: 'Person recording short-form video on a phone',
  },
]

export default function RealtorHubFeatures() {
  return (
    <section className="bg-[#FAF9F6] px-6 py-20 lg:py-24">
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 max-w-2xl">
          <h2 className="font-heading text-3xl font-bold leading-tight text-[#111111] sm:text-4xl">
            Designed for those who curate the market.
          </h2>
          <p className="mt-3 text-base leading-relaxed text-[#6B6B6B]">
            Stop relying on public tools. Use the intelligence engine built for the professional
            workflow.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <article
              key={f.title}
              className="overflow-hidden rounded-2xl border border-[#E8E6E1] bg-white transition-shadow hover:shadow-lg"
            >
              <div className="relative h-44 bg-[#1C2C1A]">
                <Image
                  src={f.image}
                  alt={f.alt}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover"
                />
              </div>
              <div className="p-5">
                <h3 className="font-heading text-lg font-semibold text-[#111111]">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#6B6B6B]">{f.body}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
