// Number formatting pinned to Canadian grouping (comma thousands), regardless
// of the visitor's device locale. Bare `n.toLocaleString()` uses the *device*
// locale — e.g. an en-IN phone renders 5_149_000 as "51,49,000" (lakh grouping)
// instead of "5,149,000". Always format prices/measurements through here.
const LOCALE = 'en-CA'

/** e.g. 5_149_000 → "5,149,000" */
export const formatNumber = (n: number): string => n.toLocaleString(LOCALE)

/** e.g. 5_149_000 → "$5,149,000" */
export const formatPrice = (n: number): string => `$${n.toLocaleString(LOCALE)}`

/**
 * Compact price for tight surfaces (market snapshot, hero): 4_800_000 → "$4.8M",
 * 850_000 → "$850k", 999 → "$999". Drops a trailing ".0" (5_000_000 → "$5M").
 */
export function formatPriceCompact(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return '—'
  if (n >= 1_000_000) {
    const m = n / 1_000_000
    return `$${(m % 1 === 0 ? m.toFixed(0) : m.toFixed(1))}M`
  }
  if (n >= 1_000) return `$${Math.round(n / 1_000)}k`
  return `$${Math.round(n)}`
}

/**
 * DDF `LeaseAmountFrequency` → the suffix shown after a rental's price
 * ("Monthly" → "/mo"). Returns null for sales (no frequency) and for values we
 * don't recognise, so an unmapped code renders a bare price rather than raw
 * feed text. JUL21FIX-04.
 */
export function formatLeaseFrequency(frequency?: string | null): string | null {
  if (!frequency) return null
  switch (frequency.trim().toLowerCase()) {
    case 'monthly':
    case 'month':
      return '/mo'
    case 'yearly':
    case 'annually':
    case 'year':
      return '/yr'
    case 'weekly':
    case 'week':
      return '/wk'
    case 'daily':
    case 'day':
      return '/day'
    default:
      return null
  }
}

/** Metres → human distance: 320 → "320 m", 1_200 → "1.2 km". */
export function formatDistance(meters: number): string {
  if (!Number.isFinite(meters) || meters < 0) return '—'
  if (meters < 1_000) return `${Math.round(meters)} m`
  return `${(meters / 1_000).toFixed(1)} km`
}

/** "14:00:00.00" / "14:00" → "2:00 PM" */
export function formatOpenHouseTime(time: string | null | undefined): string {
  if (!time) return ''
  const [h, m] = time.split(':')
  const hour = Number(h)
  if (Number.isNaN(hour)) return ''
  const period = hour >= 12 ? 'PM' : 'AM'
  const h12 = hour % 12 === 0 ? 12 : hour % 12
  return `${h12}:${(m ?? '00').padStart(2, '0')} ${period}`
}

/** ("14:00:00.00", "16:00:00.00") → "2:00 PM – 4:00 PM" */
export function formatOpenHouseTimeRange(
  start: string | null | undefined,
  end: string | null | undefined,
): string {
  const s = formatOpenHouseTime(start)
  const e = formatOpenHouseTime(end)
  if (s && e) return `${s} – ${e}`
  return s || e
}

/** REALTOR.ca homepage — the fallback when a listing has no deep-link. */
export const REALTOR_HOMEPAGE = 'https://www.realtor.ca'

/**
 * Normalize a DDF `ListingURL` into a safe absolute href for the
 * "Powered by REALTOR.ca" badge. DDF returns the URL WITHOUT a scheme
 * (e.g. "www.realtor.ca/real-estate/123/..."), which a browser would treat as
 * a relative path — breaking the badge deep-link. Prepend https:// when the
 * scheme is missing, and fall back to the REALTOR.ca homepage when absent.
 */
export function realtorHref(url?: string | null): string {
  const trimmed = url?.trim()
  if (!trimmed) return REALTOR_HOMEPAGE
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return `https://${trimmed.replace(/^\/+/, '')}`
}
