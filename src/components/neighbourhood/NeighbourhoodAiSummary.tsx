'use client'

import { useEffect, useState } from 'react'
import type { NeighbourhoodAiSummaryData, NeighbourhoodSummarySection } from '@/lib/api/neighbourhoods'
import { getNeighbourhoodAiSummary } from '@/lib/api/neighbourhoods'

interface Props {
  slug: string
  name: string
  city: string
}

function Skeleton() {
  return (
    <section className="py-10 border-b border-[#E8E6E1]">
      <div className="h-2.5 w-44 bg-[#E8E6E1] rounded mb-5 animate-pulse" />
      <div className="space-y-5 max-w-3xl">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="space-y-2">
            <div className="h-3 w-48 bg-[#E8E6E1] rounded animate-pulse" />
            <div className="h-2.5 w-full bg-[#E8E6E1] rounded animate-pulse" />
            <div className="h-2.5 w-5/6 bg-[#E8E6E1] rounded animate-pulse" />
            <div className="h-2.5 w-4/6 bg-[#E8E6E1] rounded animate-pulse" />
          </div>
        ))}
      </div>
    </section>
  )
}

function SectionBlock({ section }: { section: NeighbourhoodSummarySection }) {
  return (
    <div>
      <p className="text-sm font-semibold text-[#111111] mb-1.5">{section.heading}</p>
      <ul className="space-y-1">
        {section.points.map((point, i) => (
          <li key={i} className="flex gap-2 text-[#6B6B6B] text-sm leading-relaxed font-ui">
            <span className="text-[#1C3829] shrink-0 mt-0.5">•</span>
            <span>{point}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function NeighbourhoodAiSummary({ slug, name, city }: Props) {
  const [data, setData] = useState<NeighbourhoodAiSummaryData | null | 'loading'>('loading')

  useEffect(() => {
    getNeighbourhoodAiSummary(slug)
      .then((result) => setData(result))
      .catch(() => setData(null))
  }, [slug])

  if (data === 'loading') return <Skeleton />

  if (!data) {
    return (
      <section className="py-10 border-b border-[#E8E6E1]">
        <p className="text-[11px] font-semibold text-[#1C3829] uppercase tracking-widest mb-3">
          About the Neighbourhood
        </p>
        <p className="text-[#6B6B6B] text-base leading-relaxed max-w-3xl font-ui">
          {name} is a vibrant community in {city} known for its welcoming atmosphere and excellent
          quality of life.
        </p>
      </section>
    )
  }

  const sections = [data.safety, data.dailyLife, data.schools, data.growth]

  return (
    <section className="py-10 border-b border-[#E8E6E1]">
      <p className="text-[11px] font-semibold text-[#1C3829] uppercase tracking-widest mb-5">
        About the Neighbourhood
      </p>
      <div className="space-y-5 max-w-3xl">
        {sections.map((section) => (
          <SectionBlock key={section.heading} section={section} />
        ))}
      </div>
      <p className="mt-5 text-[10px] text-[#B0AAAA] font-ui">
        AI-generated summary · For informational context only
      </p>
    </section>
  )
}
