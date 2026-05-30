import type { Neighbourhood } from '@/types/neighbourhood'
import { formatPrice } from '@/types/search'

interface Props {
  neighbourhood: Neighbourhood
}

interface StatTileProps {
  label: string
  value: string | number | undefined
}

function StatTile({ label, value }: StatTileProps) {
  return (
    <div className="bg-[#FAF9F6] rounded-xl p-4 flex flex-col gap-1">
      <p className="text-[11px] text-[#6B6B6B] font-ui uppercase tracking-widest">{label}</p>
      <p className="text-xl font-semibold text-[#111111] font-heading">
        {value != null ? String(value) : '—'}
      </p>
    </div>
  )
}

export default function NeighbourhoodMetrics({ neighbourhood }: Props) {
  const medianFormatted = neighbourhood.medianPrice
    ? formatPrice(neighbourhood.medianPrice)
    : undefined

  return (
    <div className="bg-white rounded-2xl border border-[#E8E6E1] p-6 shadow-sm h-full flex flex-col gap-5">
      <div>
        <p className="text-[10px] font-semibold text-[#1C3829] uppercase tracking-widest mb-0.5">
          Neighbourhood
        </p>
        <p className="text-[10px] text-[#6B6B6B] font-ui">Key statistics at a glance</p>
      </div>

      <div className="grid grid-cols-2 gap-3 flex-1">
        <StatTile label="Median Price" value={medianFormatted} />
        <StatTile label="Walk Score" value={neighbourhood.walkScore} />
        <StatTile label="Transit Score" value={neighbourhood.transitScore} />
        <StatTile label="School Grade" value={neighbourhood.schoolGrade} />
      </div>

      <p className="text-[11px] text-[#6B6B6B] leading-relaxed pt-3 border-t border-[#E8E6E1]">
        Area specialists on this page have an average of 11 active listings in{' '}
        <span className="font-semibold text-[#111111]">{neighbourhood.name}</span>.
      </p>
    </div>
  )
}
