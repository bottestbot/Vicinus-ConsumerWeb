import apiClient from './client'

export type PreferredMethodContact = 'email' | 'phone' | 'text'

export interface PropertyInquiryInput {
  /** DDF ListingKey — equals PropertyDetail.id. */
  listingKey: string
  /** Listing address, used for the notification subject line. */
  propertyAddress?: string
  name: string
  email: string
  phone?: string
  message?: string
  /** CreateLead requires this; defaults to 'email' server-side. */
  preferredMethodContact?: PreferredMethodContact
  // Honeypot — must stay empty. Bots fill hidden fields; a filled value is
  // silently rejected server-side. Named innocuously so bots take the bait.
  company?: string
}

export interface PropertyInquiryResult {
  ok: boolean
}

// POST /lead/inquiry — sends a buyer's "Email REALTOR®" inquiry. The API mirrors
// it into Airtable, where an automation emails the team (CREA's DDF Lead API is
// the eventual compliant delivery to the agent). Resolves { ok:false } when
// delivery fails so the caller can prompt a retry.
export async function submitPropertyInquiry(
  input: PropertyInquiryInput,
): Promise<PropertyInquiryResult> {
  const res = await apiClient.post('/lead/inquiry', input)
  return res.data as PropertyInquiryResult
}
