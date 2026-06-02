import Image from 'next/image'
import type { EditorialCuration } from '@/types/dashboard'

const MOCK_CURATIONS: EditorialCuration[] = [
  {
    id: 'ec1',
    title: 'The Glass Pavilion',
    description: 'Where indoor and outdoor living dissolve into one seamless experience.',
    imageUrl: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600&q=80',
    tag: 'Architecture',
    publishedAt: null,
  },
  {
    id: 'ec2',
    title: 'Rosedale, Reimagined',
    description: 'Toronto's most storied enclave finds its footing in the modern era.',
    imageUrl: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=600&q=80',
    tag: 'Neighbourhood',
    publishedAt: null,
  },
  {
    id: 'ec3',
    title: 'The Waterfront Edit',
    description: 'A curated selection of lakefront homes redefining luxury in Ontario.',
    imageUrl: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&q=80',
    tag: 'Curated',
    publishedAt: null,
  },
]

function EditorialCard({ item }: { item: EditorialCuration }) {
  const imageUrl =
    item.imageUrl ||
    'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=600&q=80'

  return (
    <div className="group relative rounded-2xl overflow-hidden border border-[#E8E6E1] bg-white cursor-pointer hover:shadow-md transition-all duration-200 shrink-0 w-72 sm:w-auto">
      <div className="relative h-44 overflow-hidden bg-[#F2F0EB]">
        <Image
          src={imageUrl}
          alt={item.title ?? 'Editorial'}
          fill
          sizes="(max-width: 768px) 288px, 400px"
          className="object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
        {item.tag && (
          <div className="absolute top-3 left-3">
            <span className="bg-[#1C3829] text-white text-[10px] font-semibold px-2.5 py-0.5 rounded-full uppercase tracking-widest">
              {item.tag}
            </span>
          </div>
        )}
      </div>
      <div className="p-4">
        <p className="font-heading text-lg font-semibold text-[#111111] mb-1 leading-tight">
          {item.title ?? 'Untitled'}
        </p>
        {item.description && (
          <p className="text-xs text-[#6B6B6B] line-clamp-2">{item.description}</p>
        )}
      </div>
    </div>
  )
}

interface Props {
  editorial: EditorialCuration[]
}

export default function EditorialCurations({ editorial }: Props) {
  const items = editorial.length > 0 ? editorial.slice(0, 3) : MOCK_CURATIONS

  return (
    <section className="bg-[#111111] rounded-2xl p-6 sm:p-8">
      <div className="flex items-end justify-between mb-6">
        <div>
          <p className="text-[11px] font-semibold text-[#A8C5B5] uppercase tracking-widest mb-1">
            Curated For You
          </p>
          <h2 className="font-heading text-2xl font-semibold text-white">
            Editorial Curations
          </h2>
        </div>
        <span className="text-xs text-white/40 hidden sm:block">By the Vicinus team</span>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-2 -mx-6 px-6 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-3 sm:overflow-visible scrollbar-none">
        {items.map((item) => (
          <EditorialCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  )
}
