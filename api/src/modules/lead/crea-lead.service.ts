import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { HttpService } from '@nestjs/axios'
import { firstValueFrom } from 'rxjs'
import { DdfAuthService } from '../ddf-sync/ddf-auth.service'
import type { PreferredMethodContact } from './dto/create-lead.dto'

/** DDF Lead API CreateLead endpoint (REAW "Email REALTOR®" delivery). */
const DEFAULT_LEAD_URL = 'https://ddfapi.realtor.ca/v1/Lead/CreateLead'

export interface CreaLeadInput {
  /** DDF MemberKey of the listing agent (Property.ddfAgentKey). */
  memberKey: string
  listingKey: string
  senderName: string
  senderEmail: string
  senderPhone: string | null
  preferredMethodContact: PreferredMethodContact
  message: string
  /** en-CA (default) or fr-CA. */
  culture?: string
}

export type CreaLeadOutcome = 'delivered' | 'skipped' | 'failed'

/**
 * Submits a buyer inquiry to CREA's DDF Lead API (`CreateLead`) so CREA forwards
 * it to the listing REALTOR® — the REAW-tier compliant delivery. Per the DDF
 * docs the call uses the ordinary `DDFApi_Read` token (there is no separate
 * write scope); the only server-side gate is whether the Destination/feed is
 * REAW-provisioned for lead submission — an un-provisioned feed returns 401.
 *
 * Gated behind `DDF_LEAD_API_ENABLED` so it stays a safe no-op until that
 * provisioning is confirmed. `DDF_LEAD_SUPPRESS_EMAIL=true` sends
 * `?SuppressEmail=true`, which validates the round-trip without emailing the
 * real agent — use it to test in staging.
 */
@Injectable()
export class CreaLeadService {
  private readonly logger = new Logger(CreaLeadService.name)

  constructor(
    private readonly auth: DdfAuthService,
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {}

  private get enabled(): boolean {
    return this.config.get<string>('DDF_LEAD_API_ENABLED') === 'true'
  }

  async createLead(input: CreaLeadInput): Promise<CreaLeadOutcome> {
    if (!this.enabled) {
      this.logger.warn(
        `DDF Lead API disabled — CreateLead skipped for listing ${input.listingKey}. ` +
          'Set DDF_LEAD_API_ENABLED=true once the feed is REAW-provisioned for lead submission.',
      )
      return 'skipped'
    }

    // SenderPhoneNumber is an int64 on CREA's side; strip formatting to digits.
    const phoneDigits = input.senderPhone ? input.senderPhone.replace(/\D/g, '') : ''
    const needsPhone =
      input.preferredMethodContact === 'phone' || input.preferredMethodContact === 'text'
    if (needsPhone && !phoneDigits) {
      // Should be caught client-side; guard so we don't send a 400 to CREA.
      this.logger.error(
        `CreateLead requires a phone number when PreferredMethodContact=${input.preferredMethodContact} (listing ${input.listingKey})`,
      )
      return 'failed'
    }

    const payload: Record<string, unknown> = {
      Culture: input.culture || 'en-CA',
      MemberKey: input.memberKey,
      ListingKey: input.listingKey,
      SenderName: input.senderName,
      SenderEmailAddress: input.senderEmail,
      PreferredMethodContact: input.preferredMethodContact,
      // CreateLead caps Message at 500 chars.
      Message: input.message.slice(0, 500),
    }
    // Only include the phone when we actually have digits (field is nullable).
    if (phoneDigits) payload.SenderPhoneNumber = Number(phoneDigits)

    const baseUrl = this.config.get<string>('DDF_LEAD_API_URL') || DEFAULT_LEAD_URL
    const suppressEmail = this.config.get<string>('DDF_LEAD_SUPPRESS_EMAIL') === 'true'
    const url = suppressEmail ? `${baseUrl}?SuppressEmail=true` : baseUrl

    try {
      const token = await this.auth.getToken()
      await firstValueFrom(
        this.http.post(url, payload, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }),
      )
      this.logger.log(
        `CreateLead delivered for listing ${input.listingKey}${suppressEmail ? ' (email suppressed)' : ''}`,
      )
      return 'delivered'
    } catch (err) {
      const res = (err as { response?: { data?: unknown; status?: number } }).response
      // Never log the buyer's PII — only the listing, status and CREA's message.
      this.logger.error(
        `CreateLead failed for listing ${input.listingKey} — status ${res?.status ?? 'n/a'}: ${
          res?.data ? JSON.stringify(res.data) : (err as Error).message
        }`,
      )
      return 'failed'
    }
  }
}
