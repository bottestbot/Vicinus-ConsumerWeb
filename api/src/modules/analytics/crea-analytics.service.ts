import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { HttpService } from '@nestjs/axios'
import { firstValueFrom } from 'rxjs'
import { PrismaService } from '../../prisma/prisma.service'
import { RedisService } from '../../common/redis/redis.service'

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
   * Stable per-visitor identifier. Server-issued (CREA-02) — callers do not
   * get to choose this. The DestinationId is appended before sending, per spec.
   */
  uuid: string
  /** Optional end-user IP address (forwarded from the request). */
  ip?: string
  /** Optional referring URL. */
  referralUrl?: string
  /** 1 = English, 2 = French. */
  languageId?: number
}

/** CREA-04: cap the outbound rate so an inbound burst can't fan out 1:1. */
const DRAIN_INTERVAL_MS = 100
/** CREA-04: bound the queue so a flood costs memory we control, not all of it. */
const MAX_QUEUE_LENGTH = 5_000
/** CREA-03: how long a validated ListingKey stays trusted. */
const KEY_VALIDATION_TTL_SECONDS = 3_600

/**
 * CREA DDF (Task #2) analytics client. Reports listing view / click / lead
 * events back to the source board, as required of a Real Estate Advertising
 * Website on the National Shared Pool.
 *
 * Every call is best-effort: errors are swallowed/logged and never propagate,
 * so analytics can never block or fail a user request.
 */
@Injectable()
export class CreaAnalyticsService implements OnModuleDestroy {
  private readonly logger = new Logger(CreaAnalyticsService.name)

  /** CREA-04: pending events, drained at a fixed rate rather than immediately. */
  private readonly queue: CreaLogEventInput[] = []
  private drainTimer?: NodeJS.Timeout
  private droppedSinceLastWarn = 0

  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  onModuleDestroy(): void {
    if (this.drainTimer) clearInterval(this.drainTimer)
  }

  /**
   * Validate and enqueue a single analytics event.
   *
   * Resolves `true` if the event was accepted for delivery, `false` if it was
   * rejected (unknown listing, or analytics disabled). Never throws.
   */
  async logEvent(input: CreaLogEventInput): Promise<boolean> {
    const destinationId = this.config.get<string>('DDF_DESTINATION_ID')
    if (!destinationId) {
      // Analytics is opt-in; without a DestinationId there is nothing to report.
      this.logger.debug('DDF_DESTINATION_ID not set — skipping CREA LogEvents')
      return false
    }

    // CREA-03: only report events for listings we actually serve. Without this
    // the endpoint will forward any 64-char string to CREA under our
    // DestinationId, which is both abusable and pollutes the board's data.
    if (!(await this.isKnownListing(input.listingId))) {
      this.logger.warn(`Rejected analytics event for unknown listing ${input.listingId}`)
      return false
    }

    if (this.queue.length >= MAX_QUEUE_LENGTH) {
      this.droppedSinceLastWarn += 1
      if (this.droppedSinceLastWarn % 100 === 1) {
        this.logger.warn(
          `CREA analytics queue full (${MAX_QUEUE_LENGTH}) — dropped ${this.droppedSinceLastWarn} events`,
        )
      }
      return false
    }

    this.queue.push(input)
    this.ensureDraining(destinationId)
    return true
  }

  /**
   * CREA-03. Is this ListingKey one we serve? Checks the Redis detail cache
   * first (populated on every property-detail read), then falls back to the
   * local Property table. A positive result is cached so a browsing session
   * doesn't re-query per event.
   */
  private async isKnownListing(listingKey: string): Promise<boolean> {
    const validationKey = `analytics:known:${listingKey}`

    try {
      if (await this.redis.get(validationKey)) return true
      if (await this.redis.get(`listing:${listingKey}`)) {
        await this.redis.set(validationKey, '1', KEY_VALIDATION_TTL_SECONDS)
        return true
      }
    } catch {
      // Redis unavailable — fall through to the database rather than failing
      // closed, which would silently stop all compliance reporting.
    }

    try {
      const found = await this.prisma.property.findUnique({
        where: { ddfListingKey: listingKey },
        select: { id: true },
      })
      if (!found) return false

      await this.redis
        .set(validationKey, '1', KEY_VALIDATION_TTL_SECONDS)
        .catch(() => undefined)
      return true
    } catch (err) {
      // If we cannot verify, report anyway: under-reporting is the compliance
      // failure, and the rate limit still bounds the damage of a bad actor.
      this.logger.warn(
        `Could not validate listing ${listingKey}, forwarding anyway: ${(err as Error).message}`,
      )
      return true
    }
  }

  /** CREA-04: start the drain loop lazily; it idles itself when the queue empties. */
  private ensureDraining(destinationId: string): void {
    if (this.drainTimer) return

    this.drainTimer = setInterval(() => {
      const next = this.queue.shift()
      if (!next) {
        clearInterval(this.drainTimer)
        this.drainTimer = undefined
        if (this.droppedSinceLastWarn > 0) this.droppedSinceLastWarn = 0
        return
      }
      this.send(next, destinationId)
    }, DRAIN_INTERVAL_MS)
  }

  /** Fire one event at CREA. Fire-and-forget; all errors are swallowed. */
  private send(input: CreaLogEventInput, destinationId: string): void {
    const params: Record<string, string> = {
      ListingID: input.listingId,
      DestinationID: destinationId,
      EventType: input.eventType,
      // Per the CREA spec the DestinationId is appended to the visitor UUID.
      UUID: `${input.uuid}${destinationId}`,
    }
    if (input.ip) params.IP = input.ip
    if (input.referralUrl) params.ReferralURL = input.referralUrl
    if (input.languageId) params.LanguageID = String(input.languageId)

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
