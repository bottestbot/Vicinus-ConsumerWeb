import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { HttpService } from '@nestjs/axios'
import { firstValueFrom } from 'rxjs'

const AIRTABLE_API_BASE_URL = 'https://api.airtable.com/v0'

/** Table name used when AIRTABLE_REALTOR_WAITLIST_TABLE is not set. */
const DEFAULT_TABLE = 'Realtor Waitlist'

export interface RealtorWaitlistRecord {
  fullName: string
  email: string
  brokerage: string | null
  cityMarket: string | null
  source: string
}

/**
 * Mirrors Realtor Hub waitlist signups into an Airtable base. The database
 * stays the source of truth; Airtable is the ops-facing view, and an Airtable
 * automation ("When a record is created → Send email") is what actually
 * notifies the team of a new signup — so the recipient list lives in Airtable,
 * not in this codebase.
 *
 * Best-effort by design: every call is fire-and-forget and swallows errors, so
 * an Airtable outage can never fail or slow down a realtor's signup.
 */
@Injectable()
export class AirtableWaitlistService {
  private readonly logger = new Logger(AirtableWaitlistService.name)

  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {}

  /**
   * Push one signup to Airtable. Non-blocking: returns immediately and does not
   * await the network round-trip.
   */
  pushRealtorSignup(record: RealtorWaitlistRecord): void {
    const apiKey = this.config.get<string>('AIRTABLE_API_KEY')
    const baseId = this.config.get<string>('AIRTABLE_BASE_ID')
    if (!apiKey || !baseId) {
      // Airtable mirroring is opt-in; without credentials there is nothing to do.
      // Warn, not debug: Nest suppresses debug under NODE_ENV=production, which
      // made a missing-credentials deploy look identical to a working one.
      this.logger.warn(
        `Airtable not configured — skipping waitlist mirror (apiKey=${apiKey ? 'set' : 'missing'}, baseId=${baseId ? 'set' : 'missing'})`,
      )
      return
    }

    const table =
      this.config.get<string>('AIRTABLE_REALTOR_WAITLIST_TABLE') || DEFAULT_TABLE
    const url = `${AIRTABLE_API_BASE_URL}/${baseId}/${encodeURIComponent(table)}`

    const body = {
      // typecast lets Airtable coerce values into single-select / date columns
      // instead of rejecting the whole record.
      typecast: true,
      fields: {
        Name: record.fullName,
        Email: record.email,
        Brokerage: record.brokerage ?? '',
        'City / Market': record.cityMarket ?? '',
        Source: record.source,
      },
    }

    // Fire-and-forget: do not await, swallow all errors. Never log the email or
    // name (PII) — only whether the mirror succeeded.
    firstValueFrom(
      this.http.post(url, body, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      }),
    ).catch((err: unknown) => {
      this.logger.warn(
        `Airtable waitlist mirror failed: ${(err as Error).message}`,
      )
    })
  }
}
