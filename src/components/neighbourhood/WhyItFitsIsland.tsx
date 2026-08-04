'use client'

// SEO-03 — client island around the "Why {name} fits you" card.
//
// `personalization` is per-user and must never be indexed, so it is never part of
// the server payload this page renders. The card's cold-start copy (heading,
// subtitle, sentence) is generic and derived from the name alone, so that much
// still lands in the HTML; the chips and match % fill in from the client query,
// and `WhyItFitsCard` re-fetches a signed-in user's real match on top of that.
import { useNeighbourhoodDetail } from '@/hooks/useNeighbourhoodDetail'
import WhyItFitsCard from './WhyItFitsCard'

interface Props {
  slug: string
  name: string
}

export default function WhyItFitsIsland({ slug, name }: Props) {
  const { data } = useNeighbourhoodDetail(slug)

  return <WhyItFitsCard name={name} slug={slug} personalization={data?.personalization ?? null} />
}
