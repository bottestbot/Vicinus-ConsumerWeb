import apiClient from './client'

export type ContactInterest = 'buy' | 'sell'

export interface ContactInput {
  name: string
  email: string
  phone?: string
  message?: string
  /** Optional — not required, unlike a listing inquiry's contact method. */
  interest?: ContactInterest
  // Honeypot — must stay empty. Bots fill hidden fields; a filled value is
  // silently rejected server-side. Named innocuously so bots take the bait.
  company?: string
}

export interface ContactResult {
  ok: boolean
}

// POST /contact — sends the homepage "Get in Touch" message to the Vicinus
// team (not a specific listing agent, so nothing DDF-related is sent). The API
// mirrors it into Airtable, where an automation emails the team. Resolves
// { ok:false } when delivery fails so the caller can prompt a retry.
export async function submitContact(input: ContactInput): Promise<ContactResult> {
  const res = await apiClient.post('/contact', input)
  return res.data as ContactResult
}
