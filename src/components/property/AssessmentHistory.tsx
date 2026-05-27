'use client'

// FE-408: AssessmentHistory — sortable table
import { useState } from 'react'
import { ChevronUp, ChevronDown } from 'lucide-react'
import type { AssessmentRecord } from '@/types/property'

interface AssessmentHistoryProps {
  records: AssessmentRecord[]
}

type SortKey = keyof AssessmentRecord
type SortDir = 'asc' | 'desc'

function fmt(n: number) {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
    maximumFractionDigits: 0,
  }).format(n)
}

export default function AssessmentHistory({ records }: AssessmentHistoryProps) {
  const [sortKey, setSortKey] = useState<SortKey>('year')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  const sorted = [...records].sort((a, b) => {
    const av = a[sortKey] as number
    const bv = b[sortKey] as number
    return sortDir === 'asc' ? av - bv : bv - av
  })

  const columns: { key: SortKey; label: string }[] = [
    { key: 'year', label: 'Year' },
    { key: 'assessedValue', label: 'Assessed Value' },
    { key: 'landValue', label: 'Land Value' },
    { key: 'buildingValue', label: 'Building Value' },
    { key: 'taxes', label: 'Property Taxes' },
  ]

  function SortIcon({ col }: { col: SortKey }) {
    if (col !== sortKey)
      return <ChevronUp size={12} className="text-[#D1CEC9]" />
    return sortDir === 'asc'
      ? <ChevronUp size={12} className="text-[#1C3829]" />
      : <ChevronDown size={12} className="text-[#1C3829]" />
  }

  return (
    <section>
      <h2 className="font-heading text-xl font-semibold text-[#111111] mb-4">
        Assessment History
      </h2>

      <div className="bg-white rounded-2xl border border-[#E8E6E1] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#F2F0EB]">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    onClick={() => handleSort(col.key)}
                    className="text-left px-5 py-3.5 text-[#6B6B6B] text-xs font-semibold cursor-pointer hover:text-[#111111] transition-colors select-none"
                  >
                    <span className="flex items-center gap-1.5">
                      {col.label}
                      <SortIcon col={col.key} />
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((row, i) => (
                <tr
                  key={row.year}
                  className={[
                    'border-b border-[#F9F8F5] hover:bg-[#FAFAF8] transition-colors',
                    i === 0 ? 'bg-[#F7F5F0]' : '',
                  ].join(' ')}
                >
                  <td className="px-5 py-3.5 font-semibold text-[#111111]">{row.year}</td>
                  <td className="px-5 py-3.5 text-[#111111]">{fmt(row.assessedValue)}</td>
                  <td className="px-5 py-3.5 text-[#6B6B6B]">{fmt(row.landValue)}</td>
                  <td className="px-5 py-3.5 text-[#6B6B6B]">{fmt(row.buildingValue)}</td>
                  <td className="px-5 py-3.5 text-[#6B6B6B]">{fmt(row.taxes)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-[10px] text-[#6B6B6B] mt-2">
        Source: BC Assessment Authority. Values are assessed, not market value.
      </p>
    </section>
  )
}
