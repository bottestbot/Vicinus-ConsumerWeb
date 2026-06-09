'use client'

import { useState } from 'react'
import Image from 'next/image'
import type { EditorialCuration } from '@/types/dashboard'

type EditorialTab = 'Neighborhoods' | 'Feeds'

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
    description: "Toronto's most storied enclave finds its footing in the modern era.",
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
  {
    id: 'ec4',
    title: 'Forest Hill Revival',
    description: 'Heritage architecture meets contemporary design in this storied neighbourhood.',
    imageUrl: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=600&q=80',
    tag: 'Nature',
    publishedAt: null,
  },
]

function EditorialCard({ item }: { item: EditorialCuration }) {
  const imageUrl =
    item.imageUrl ||
    'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=600&q=80'

  return (
    <div className="group relative rounded-2xl overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-200 shrink-0 w-64 sm:w-auto aspect-[3/4] sm:aspect-auto sm:h-64">
      <Image
        src={imageUrl}
        alt={item.title ?? 'Editorial'}
        fill
        sizes="(max-width: 768px) 256px, 25vw"
        className="object-cover group-hover:scale-105 transition-transform duration-700"
      />
      {/* Dark gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

      {/* Content at bottom */}
      <div className="absolute bottom-0 left-0 right-0 p-4">
        {item.tag && (
          <span className="inline-block text-[10px] font-bold text-[#A3E635] uppercase tracking-widest mb-1.5">
            {item.tag}
          </span>
        )}
        <p className="font-heading text-base font-semibold text-white leading-snug">
          {item.title ?? 'Untitled'}
        </p>
        {item.description && (
          <p className="text-xs text-white/60 mt-1 line-clamp-2">{item.description}</p>
        )}
      </div>
    </div>
  )
}

interface Props {
  editorial: EditorialCuration[]
}

export default function EditorialCurations({ editorial }: Props) {
  const [activeTab, setActiveTab] = useState<EditorialTab>('Neighborhoods')
  const items = editorial.length > 0 ? editorial.slice(0, 4) : MOCK_CURATIONS

  return (
    <section className="bg-[#111111] rounded-2xl p-6 sm:p-8">
      {/* Header row */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <p className="text-[11px] font-bold text-[#A3E635] uppercase tracking-widest mb-1">
            Intelligence Hub
          </p>
          <h2 className="font-heading text-3xl font-semibold text-white">
            Editorial Curations
          </h2>
        </div>

        {/* Tab toggle */}
        <div className="flex gap-1 shrink-0 bg-white/10 rounded-full p-1 mt-1">
          {(['Neighborhoods', 'Feeds'] as EditorialTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                activeTab === tab
                  ? 'bg-white text-[#111111]'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Cards row */}
      <div className="flex gap-4 overflow-x-auto pb-2 -mx-6 px-6 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-4 sm:overflow-visible scrollbar-none">
        {items.map((item) => (
          <EditorialCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  )
}
