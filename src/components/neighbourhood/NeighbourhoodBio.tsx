import type { Neighbourhood } from '@/types/neighbourhood'

const PLACEHOLDER_BIO =
  'A coveted enclave defined by grand historic estates, canopied streets, and an extraordinary quality of life. Residents enjoy proximity to premier schools, curated boutiques, and some of the city\'s finest dining — all within a neighbourhood that prizes privacy and prestige above all.'

interface Props {
  neighbourhood: Neighbourhood
}

export default function NeighbourhoodBio({ neighbourhood }: Props) {
  const bio = neighbourhood.bio ?? PLACEHOLDER_BIO

  return (
    <section className="py-10 border-b border-[#E8E6E1]">
      <p className="text-[11px] font-semibold text-[#1C3829] uppercase tracking-widest mb-3">
        About the Neighbourhood
      </p>
      <p className="text-[#6B6B6B] text-base leading-relaxed max-w-3xl font-ui">{bio}</p>
    </section>
  )
}
