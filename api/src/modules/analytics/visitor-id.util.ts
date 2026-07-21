import { randomUUID } from 'node:crypto'
import type { Request, Response } from 'express'

/** Signed cookie holding the server-issued visitor id. */
export const VISITOR_COOKIE = 'vic_vid'

/** One year — the id only needs to outlive CREA's dedup window, but a stable
 *  value also keeps repeat-visitor counts meaningful. */
const VISITOR_COOKIE_MAX_AGE_MS = 365 * 24 * 60 * 60 * 1000

/**
 * CREA-02. Resolve the visitor identifier for an analytics event.
 *
 * The identity reported to CREA must be issued by us, not supplied by the
 * caller. CREA dedups events by UUID within a 5-minute window; if the caller
 * chooses the UUID it can simply rotate it and defeat that dedup entirely,
 * letting anyone inflate view/click/lead counts under our DestinationId.
 *
 * So: read a signed HttpOnly cookie, mint one on first sight, and never look
 * at the request body. HttpOnly also keeps the value out of reach of any
 * script on the page.
 */
export function resolveVisitorId(req: Request, res: Response): string {
  const existing = req.signedCookies?.[VISITOR_COOKIE] as string | undefined
  if (typeof existing === 'string' && existing.length > 0) return existing

  const issued = randomUUID()

  // In production the frontend (vicinus.ca) and the API (Railway) are different
  // sites, so the cookie only rides along on the analytics XHR with
  // SameSite=None; Secure. Locally they are localhost on two ports — same site —
  // where Lax works and None would be rejected for not being Secure.
  const crossSite = process.env.NODE_ENV === 'production'

  res.cookie(VISITOR_COOKIE, issued, {
    httpOnly: true,
    signed: true,
    sameSite: crossSite ? 'none' : 'lax',
    secure: crossSite,
    maxAge: VISITOR_COOKIE_MAX_AGE_MS,
    path: '/',
  })
  return issued
}
