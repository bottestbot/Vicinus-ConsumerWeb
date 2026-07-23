import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { HttpService } from '@nestjs/axios'
import { firstValueFrom } from 'rxjs'

const AIRTABLE_API_BASE_URL = 'https://api.airtable.com/v0'

/** Table name used when AIRTABLE_PROPERTY_LEADS_TABLE is not set. */
const DEFAULT_TABLE = 'Property Leads'

export interface PropertyLeadRecord {
  listingKey: string
  propertyAddress: string | null
  name: string
  email: string
  phone: string | null
  message: string | null
  source: string
}

/**
 * Mirrors a buyer's "Email REALTOR®" inquiry into an Airtable base, where an
 * automation ("When a record is created → Send email") notifies the team of the
 * new lead — the same ops pattern the Realtor Hub waitlist uses. The recipient
 * list lives in Airtable, not in this codebase.
 *
 * Unlike the waitlist mirror, this returns a boolean: without a database record
 * of the inquiry, the Airtable write IS the delivery, so the caller needs to
 * know whether it landed and can surface a retry to the buyer.
 */
@Injectable()
export class AirtableLeadService {
  private readonly logger = new Logger(AirtableLeadService.name)

  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {}

  /**
   * Push one inquiry to Airtable. Awaits the round-trip and resolves `true` on
   * success, `false` if unconfigured or the write failed. Never throws; never
   * logs the buyer's name/email/phone/message (PII) — only the outcome.
   */
  async pushLead(record: PropertyLeadRecord): Promise<boolean> {
    const apiKey = this.config.get<string>('AIRTABLE_API_KEY')
    const baseId = this.config.get<string>('AIRTABLE_BASE_ID')
    if (!apiKey || !baseId) {
      this.logger.warn(
        `Airtable not configured — cannot deliver property lead (apiKey=${apiKey ? 'set' : 'missing'}, baseId=${baseId ? 'set' : 'missing'})`,
      )
      return false
    }

    const table =
      this.config.get<string>('AIRTABLE_PROPERTY_LEADS_TABLE') || DEFAULT_TABLE
    const url = `${AIRTABLE_API_BASE_URL}/${baseId}/${encodeURIComponent(table)}`

    const body = {
      // typecast lets Airtable coerce values into single-select / date columns
      // instead of rejecting the whole record.
      typecast: true,
      fields: {
        'Listing Key': record.listingKey,
        Property: record.propertyAddress ?? '',
        Name: record.name,
        Email: record.email,
        Phone: record.phone ?? '',
        Message: record.message ?? '',
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
      this.logger.warn(`Airtable property-lead mirror failed: ${(err as Error).message}`)
      return false
    }
  }
}
