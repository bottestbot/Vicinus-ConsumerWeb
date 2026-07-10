// Number formatting pinned to Canadian grouping (comma thousands), regardless
// of the visitor's device locale. Bare `n.toLocaleString()` uses the *device*
// locale — e.g. an en-IN phone renders 5_149_000 as "51,49,000" (lakh grouping)
// instead of "5,149,000". Always format prices/measurements through here.
const LOCALE = 'en-CA'

/** e.g. 5_149_000 → "5,149,000" */
export const formatNumber = (n: number): string => n.toLocaleString(LOCALE)

/** e.g. 5_149_000 → "$5,149,000" */
export const formatPrice = (n: number): string => `$${n.toLocaleString(LOCALE)}`
