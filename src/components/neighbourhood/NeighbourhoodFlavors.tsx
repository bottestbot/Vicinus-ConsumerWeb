import Image from 'next/image'

const FLAVORS = [
  {
    id: 'dining',
    imageUrl: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80',
    tag: 'Dining District',
    description:
      'Award-winning restaurants and intimate wine bars line the neighbourhood\'s heritage streets — from modern French bistros to Japanese omakase.',
  },
  {
    id: 'lifestyle',
    imageUrl: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=600&q=80',
    tag: 'The Art Scene',
  },
]

export default function NeighbourhoodFlavors({ name }: { name: string }) {
  return (
    <section className="py-10 border-b border-[#E8E6E1]">
      <div className="grid lg:grid-cols-2 gap-8 items-center">
        {/* Large image left */}
        <div className="relative h-80 lg:h-96 rounded-2xl overflow-hidden">
          <Image
            src={FLAVORS[0].imageUrl}
            alt="Dining in the neighbourhood"
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          <span className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm text-[#111111] text-[10px] font-semibold uppercase tracking-widest px-3 py-1.5 rounded-full">
            {FLAVORS[0].tag}
          </span>
        </div>

        {/* Text + small image right */}
        <div className="flex flex-col gap-5">
          <div>
            <p className="text-[11px] font-semibold text-[#1C3829] uppercase tracking-widest mb-1">
              Lifestyle & Culture
            </p>
            <h2 className="font-heading text-3xl font-semibold text-[#111111] mb-3">
              {name} Flavors.
            </h2>
            <p className="text-[#6B6B6B] text-sm leading-relaxed font-ui max-w-sm">
              {FLAVORS[0].description}
            </p>
          </div>

          <div className="relative h-44 rounded-xl overflow-hidden">
            <Image
              src={FLAVORS[1].imageUrl}
              alt="Lifestyle"
              fill
              sizes="(max-width: 1024px) 100vw, 25vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
            <span className="absolute bottom-3 left-4 text-white text-xs font-semibold">
              {FLAVORS[1].tag}
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}
