import apiClient from './client'

export interface DiscoveryCallBookingInput {
  fullName: string
  email: string
  /** ISO 8601 date, e.g. "2026-08-19" */
  date: string
  /** e.g. "9:00 AM" */
  timeSlot: string
  // Honeypot — must stay empty. Bots fill hidden fields; a filled value is
  // silently rejected server-side.
  company?: string
}

export interface DiscoveryCallBookingResult {
  ok: boolean
}

// POST /booking/discovery-call — requests a 15-minute founder discovery call.
export async function bookDiscoveryCall(
  input: DiscoveryCallBookingInput,
): Promise<DiscoveryCallBookingResult> {
  const res = await apiClient.post('/booking/discovery-call', input)
  return res.data as DiscoveryCallBookingResult
}
