import Image from 'next/image'

const FEATURES = [
  {
    title: 'Hyperlocal Market Insights',
    body: 'Go beyond basic property stats. Access enriched neighbourhood data and real-time local context on every pocket you serve—giving clients the deep expertise that wins listings.',
    image:
      'https://images.unsplash.com/photo-1526628953301-3e589a6a8b74?w=800&q=80',
    alt: 'Data visualization dashboard',
  },
  {
    title: 'Real-Time Demand Signals',
    body: 'Spot buyer interest before it shows up in MLS averages. Track aggregate buyer intent by area so you know where to focus your marketing and close faster.',
    image:
      'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80',
    alt: 'Analytics and buyer intent chart',
  },
  {
    title: 'Rich Property Showcases',
    body: 'Make your properties stand out on Vicinus. Easily publish short-form video, lifestyle media, and rich highlights directly on your Vicinus listing pages to convert interest into offers.',
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
            Designed for agents who drive the market.
          </h2>
          <p className="mt-3 text-base leading-relaxed text-[#6B6B6B]">
            Power your workflow with deep market intelligence and rich showcase tools built for
            deal velocity.
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
