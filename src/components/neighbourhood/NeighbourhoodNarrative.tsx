// NBHD-D04 — Editorial narrative. Large prose intro that sits directly below the
// hero, above the AI fit card. Hidden when there's no description.
import type { NeighbourhoodDetailResponse } from '@/types/neighbourhood-detail'

interface Props {
  neighbourhood: NeighbourhoodDetailResponse['neighbourhood']
}

export default function NeighbourhoodNarrative({ neighbourhood }: Props) {
  const text = neighbourhood.description?.trim()
  if (!text) return null

  return (
    <p className="mt-6 max-w-3xl text-lg leading-relaxed text-[#333333] sm:text-xl">
      {text}
    </p>
  )
}
