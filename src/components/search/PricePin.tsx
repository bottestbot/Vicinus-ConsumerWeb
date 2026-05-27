'use client'

import { formatPrice } from '@/types/search'

interface PricePinProps {
  price: number
  isActive?: boolean
  onMouseEnter?: () => void
  onMouseLeave?: () => void
}

export default function PricePin({ price, isActive, onMouseEnter, onMouseLeave }: PricePinProps) {
  return (
    <div
      className={['price-pin', isActive ? 'active' : ''].join(' ')}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      role="button"
      tabIndex={0}
      aria-label={`Property price ${formatPrice(price)}`}
    >
      {formatPrice(price)}
    </div>
  )
}
