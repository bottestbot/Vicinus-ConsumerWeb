'use client'

import { formatPrice } from '@/types/search'

interface PricePinProps {
  price: number | null
  isActive?: boolean
  onMouseEnter?: () => void
  onMouseLeave?: () => void
}

export default function PricePin({ price, isActive, onMouseEnter, onMouseLeave }: PricePinProps) {
  // DDF occasionally omits ListPrice — show a short label instead of "$0".
  const label = price && price > 0 ? formatPrice(price) : 'Ask'
  return (
    <div
      className={['price-pin', isActive ? 'active' : ''].join(' ')}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      role="button"
      tabIndex={0}
      aria-label={price && price > 0 ? `Property price ${formatPrice(price)}` : 'Price on request'}
    >
      {label}
    </div>
  )
}
