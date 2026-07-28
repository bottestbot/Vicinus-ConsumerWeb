import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { HttpService } from '@nestjs/axios'
import { firstValueFrom } from 'rxjs'

const AIRTABLE_API_BASE_URL = 'https://api.airtable.com/v0'

/** Table name used when AIRTABLE_CONTACT_TABLE is not set. */
const DEFAULT_TABLE = 'Vicinus Contact'

export interface ContactRecord {
  name: string
  email: string
  phone: string | null
  message: string | null
  interest: string | null
  source: string
}

/**
 * Mirrors a homepage "Get in Touch" submission into an Airtable base, where an
 * automation ("When a record is created → Send email") notifies the Vicinus
 * team — same ops pattern as the property-lead and realtor-waitlist mirrors.
 * The recipient list lives in Airtable, not in this codebase.
 *
 * Unlike the waitlist mirror, this returns a boolean: without a database record
 * of the message, the Airtable write IS the delivery, so the caller needs to
 * know whether it landed and can surface a retry to the visitor.
 */
@Injectable()
export class AirtableContactService {
  private readonly logger = new Logger(AirtableContactService.name)

  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {}

  /**
   * Push one message to Airtable. Awaits the round-trip and resolves `true` on
   * success, `false` if unconfigured or the write failed. Never throws; never
   * logs the visitor's name/email/phone/message (PII) — only the outcome.
   */
  async pushContact(record: ContactRecord): Promise<boolean> {
    const apiKey = this.config.get<string>('AIRTABLE_API_KEY')
    const baseId = this.config.get<string>('AIRTABLE_BASE_ID')
    if (!apiKey || !baseId) {
      this.logger.warn(
        `Airtable not configured — cannot deliver contact message (apiKey=${apiKey ? 'set' : 'missing'}, baseId=${baseId ? 'set' : 'missing'})`,
      )
      return false
    }

    const table = this.config.get<string>('AIRTABLE_CONTACT_TABLE') || DEFAULT_TABLE
    const url = `${AIRTABLE_API_BASE_URL}/${baseId}/${encodeURIComponent(table)}`

    const body = {
      // typecast lets Airtable coerce values into single-select / date columns
      // instead of rejecting the whole record.
      typecast: true,
      fields: {
        Name: record.name,
        Email: record.email,
        Phone: record.phone ?? '',
        Message: record.message ?? '',
        Interest: record.interest ?? '',
        Source: record.source,
      },
    }

    try {
      await firstValueFrom(
        this.http.post(url, body, {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        }),
      )
      return true
    } catch (err: unknown) {
      this.logger.warn(`Airtable contact mirror failed: ${(err as Error).message}`)
      return false
    }
  }
}
