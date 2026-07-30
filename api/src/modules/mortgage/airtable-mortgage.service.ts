import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { HttpService } from '@nestjs/axios'
import { firstValueFrom } from 'rxjs'

const AIRTABLE_API_BASE_URL = 'https://api.airtable.com/v0'

/** Table used when AIRTABLE_MORTGAGE_LEADS_TABLE is not set. */
const DEFAULT_TABLE = 'Mortgage Leads'

export interface MortgageLeadRecord {
  listingKey: string | null
  propertyAddress: string | null
  name: string
  email: string
  phone: string | null
  message: string | null
  source: string
}

/**
 * Mirrors a "Contact Mortgage Broker" submission (from the Mortgage Analysis
 * widget on the Property Detail Page) into an Airtable base, where an
 * automation ("When a record is created → Send email") notifies the team —
 * same ops pattern as the property-lead/contact/waitlist mirrors.
 *
 * Returns a boolean: without a database record of the inquiry, the Airtable
 * write IS the delivery, so the caller needs to know whether it landed.
 */
@Injectable()
export class AirtableMortgageService {
  private readonly logger = new Logger(AirtableMortgageService.name)

  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {}

  /**
   * Push one inquiry to Airtable. Awaits the round-trip and resolves `true` on
   * success, `false` if unconfigured or the write failed. Never throws; never
   * logs the buyer's name/email/phone/message (PII) — only the outcome.
   */
  async pushLead(record: MortgageLeadRecord): Promise<boolean> {
    const apiKey = this.config.get<string>('AIRTABLE_API_KEY')
    const baseId = this.config.get<string>('AIRTABLE_BASE_ID')
    if (!apiKey || !baseId) {
      this.logger.warn(
        `Airtable not configured — cannot deliver mortgage lead (apiKey=${apiKey ? 'set' : 'missing'}, baseId=${baseId ? 'set' : 'missing'})`,
      )
      return false
    }

    const table =
      this.config.get<string>('AIRTABLE_MORTGAGE_LEADS_TABLE') || DEFAULT_TABLE
    const url = `${AIRTABLE_API_BASE_URL}/${baseId}/${encodeURIComponent(table)}`

    const body = {
      // typecast lets Airtable coerce values into single-select / date columns
      // instead of rejecting the whole record.
      typecast: true,
      fields: {
        'Listing Key': record.listingKey ?? '',
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
      this.logger.warn(`Airtable mortgage-lead mirror failed: ${(err as Error).message}`)
      return false
    }
  }
}
