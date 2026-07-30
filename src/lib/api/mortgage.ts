import apiClient from './client'

export interface MortgageInquiryInput {
  /** DDF ListingKey the inquiry refers to, if any. */
  listingKey?: string
  /** Listing address, used for the notification subject line. */
  propertyAddress?: string
  name: string
  email: string
  phone?: string
  message?: string
  // Honeypot — must stay empty. Bots fill hidden fields; a filled value is
  // silently rejected server-side. Named innocuously so bots take the bait.
  company?: string
}

export interface MortgageInquiryResult {
  ok: boolean
}

// POST /mortgage/inquiry — sends a "Contact Mortgage Broker" inquiry from the
// Mortgage Analysis widget. The API mirrors it into Airtable, where an
// automation emails the team. Resolves { ok:false } when delivery fails so the
// caller can prompt a retry.
export async function submitMortgageInquiry(
  input: MortgageInquiryInput,
): Promise<MortgageInquiryResult> {
  const res = await apiClient.post('/mortgage/inquiry', input)
  return res.data as MortgageInquiryResult
}
