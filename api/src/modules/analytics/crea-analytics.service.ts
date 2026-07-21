import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { HttpService } from '@nestjs/axios'
import { firstValueFrom } from 'rxjs'

/** CREA analytics LogEvents endpoint (fixed, per the DDF analytics spec). */
const CREA_LOG_EVENTS_URL =
  'https://analytics.crea.ca/LogEvents.svc/LogEvents'

/**
 * Event types accepted by CREA's LogEvents service. `view` is a listing
 * impression, `Click` a click-through, `email_realtor` a lead sent to the
 * listing REALTOR. (Casing mirrors the CREA spec.)
 */
export type CreaEventType = 'view' | 'Click' | 'email_realtor'

export interface CreaLogEventInput {
  /** DDF ListingKey of the listing the event is about. */
  listingId: string
  eventType: CreaEventType
  /**
   * Stable per-user / per-device identifier supplied by the caller. The
   * DestinationId is appended to it before it is sent, per the CREA spec.
   */
  uuid: string
  /** Optional end-user IP address (forwarded from the request). */
  ip?: string
  /** Optional referring URL. */
  referralUrl?: string
  /** 1 = English, 2 = French. */
  languageId?: number
}

/**
 * CREA DDF (Task #2) analytics client. Fires fire-and-forget GET requests to
 * CREA's LogEvents service so listing view / click / lead events are reported
 * back to the source board, as required of a Real Estate Advertising Website
 * on the National Shared Pool.
 *
 * CREA dedups by UUID within 5-minute windows, so no client-side throttling is
 * needed. Every call is best-effort: errors are swallowed/logged and never
 * propagate, so analytics can never block or fail a user request.
 */
@Injectable()
export class CreaAnalyticsService {
  private readonly logger = new Logger(CreaAnalyticsService.name)

  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {}

  /**
   * Fire a single analytics event. Non-blocking: returns immediately and does
   * not await the network round-trip. Safe to call from any request handler.
   */
  logEvent(input: CreaLogEventInput): void {
    const destinationId = this.config.get<string>('DDF_DESTINATION_ID')
    if (!destinationId) {
      // Analytics is opt-in; without a DestinationId there is nothing to report.
      this.logger.debug('DDF_DESTINATION_ID not set — skipping CREA LogEvents')
      return
    }

    const params: Record<string, string> = {
      ListingID: input.listingId,
      DestinationID: destinationId,
      EventType: input.eventType,
      // Per the CREA spec the DestinationId is appended to the caller UUID.
      UUID: `${input.uuid}${destinationId}`,
    }
    if (input.ip) params.IP = input.ip
    if (input.referralUrl) params.ReferralURL = input.referralUrl
    if (input.languageId) params.LanguageID = String(input.languageId)

    // Fire-and-forget: do not await, swallow all errors.
    firstValueFrom(this.http.get(CREA_LOG_EVENTS_URL, { params })).catch(
      (err: unknown) => {
        this.logger.warn(
          `CREA LogEvents failed for ${input.listingId} (${input.eventType}): ${
            (err as Error).message
          }`,
        )
      },
    )
  }
}
