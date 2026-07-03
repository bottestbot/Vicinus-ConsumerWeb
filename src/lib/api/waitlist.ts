import apiClient from './client'

export interface RealtorWaitlistInput {
  fullName: string
  email: string
  brokerage?: string
  cityMarket?: string
  // Honeypot — must stay empty. Bots fill hidden fields; a filled value is
  // silently rejected server-side. Named innocuously so bots take the bait.
  company?: string
}

export interface RealtorWaitlistResult {
  ok: boolean
  // true when this email was already on the list (idempotent re-submit).
  alreadyJoined?: boolean
}

// POST /waitlist/realtor — captures a Realtor early-access signup.
export async function submitRealtorWaitlist(
  input: RealtorWaitlistInput,
): Promise<RealtorWaitlistResult> {
  const res = await apiClient.post('/waitlist/realtor', input)
  return res.data as RealtorWaitlistResult
}
