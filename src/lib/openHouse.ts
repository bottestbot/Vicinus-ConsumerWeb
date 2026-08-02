import type { OpenHouseSummary } from '@/types/search'

/**
 * Adapt the dashboard's flat `nextOpenHouse*` fields into the `OpenHouseSummary`
 * every card surface renders. The dashboard API flattened these long before the
 * shared tag existed; this keeps that contract intact instead of reshaping a
 * payload other dashboard features (schedule CTA, brief) already read.
 */
export function toOpenHouseSummary(property: {
  nextOpenHouseKey: string | null
  nextOpenHouseDate: string | null
  nextOpenHouseStartTime: string | null
  nextOpenHouseEndTime: string | null
}): OpenHouseSummary | null {
  if (!property.nextOpenHouseKey || !property.nextOpenHouseDate) return null
  return {
    openHouseKey: property.nextOpenHouseKey,
    date: property.nextOpenHouseDate,
    startTime: property.nextOpenHouseStartTime,
    endTime: property.nextOpenHouseEndTime,
  }
}
