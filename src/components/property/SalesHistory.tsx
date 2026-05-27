'use client'

// FE-409: SalesHistory — sortable table
import { useState } from 'react'
import { ChevronUp, ChevronDown, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import type { SaleRecord } from '@/types/property'

interface SalesHistoryProps {
  records: SaleRecord[]
}

type SortKey = 'date' | 'price' | 'type'
type SortDir = 'asc' | 'desc'

function fmt(n: number) {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
    maximumFractionDigits: 0,
  }).format(n)
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-CA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function priceDiff(sorted: SaleRecord[], idx: number): number | null {
  if (idx >= sorted.length - 1) return null
  const current = sorted[idx].price
  const prev = sorted[idx + 1].price
  return ((current - prev) / prev) * 100
}

function TypeBadge({ type }: { type: SaleRecord['type'] }) {
  const config: Record<SaleRecord['type'], { bg: string; text: string }> = {
    'MLS Sale': { bg: 'bg-emerald-50 text-emerald-700', text: 'MLS Sale' },
    'New Listing': { bg: 'bg-sky-50 text-sky-700', text: 'New Listing' },
    'Price Change': { bg: 'bg-amber-50 text-amber-700', text: 'Price Change' },
  }
  const c = config[type]
  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${c.bg}`}>
      {c.text}
    </span>
  )
}

export default function SalesHistory({ records }: SalesHistoryProps) {
  const [sortKey, setSortKey] = useState<SortKey>('date')
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
    if (sortKey === 'date') {
      const cmp = a.date.localeCompare(b.date)
      return sortDir === 'asc' ? cmp : -cmp
    }
    if (sortKey === 'price') {
      return sortDir === 'asc' ? a.price - b.price : b.price - a.price
    }
    const cmp = a.type.localeCompare(b.type)
    return sortDir === 'asc' ? cmp : -cmp
  })

  const columns: { key: SortKey; label: string }[] = [
    { key: 'date', label: 'Date' },
    { key: 'price', label: 'Price' },
    { key: 'type', label: 'Event' },
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
        Sales History
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
                <th className="text-left px-5 py-3.5 text-[#6B6B6B] text-xs font-semibold">
                  Change
                </th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((row, i) => {
                const diff = priceDiff(sorted, i)
                return (
                  <tr
                    key={`${row.date}-${row.price}`}
                    className="border-b border-[#F9F8F5] hover:bg-[#FAFAF8] transition-colors last:border-0"
                  >
                    <td className="px-5 py-3.5 text-[#111111]">{formatDate(row.date)}</td>
                    <td className="px-5 py-3.5 font-semibold text-[#111111]">{fmt(row.price)}</td>
                    <td className="px-5 py-3.5">
                      <TypeBadge type={row.type} />
                    </td>
                    <td className="px-5 py-3.5">
                      {diff !== null ? (
                        <span
                          className={[
                            'flex items-center gap-1 text-xs font-semibold',
                            diff > 0 ? 'text-emerald-600' : diff < 0 ? 'text-red-500' : 'text-[#6B6B6B]',
                          ].join(' ')}
                        >
                          {diff > 0
                            ? <TrendingUp size={12} />
                            : diff < 0
                            ? <TrendingDown size={12} />
                            : <Minus size={12} />}
                          {diff > 0 ? '+' : ''}{diff.toFixed(1)}%
                        </span>
                      ) : (
                        <span className="text-xs text-[#D1CEC9]">—</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-[10px] text-[#6B6B6B] mt-2">
        Source: MLS® data. Historical sales data provided by CREA.
      </p>
    </section>
  )
}
