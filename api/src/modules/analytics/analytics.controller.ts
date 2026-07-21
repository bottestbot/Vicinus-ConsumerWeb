import { Body, Controller, HttpCode, Post, Req, Res } from '@nestjs/common'
import { Throttle } from '@nestjs/throttler'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import type { Request, Response } from 'express'
import { CreaAnalyticsService } from './crea-analytics.service'
import { ListingEventDto } from './dto/listing-event.dto'
import { resolveVisitorId } from './visitor-id.util'

@ApiTags('analytics')
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly crea: CreaAnalyticsService) {}

  /**
   * Report a listing analytics event to CREA (Task #2). The DestinationId and
   * the actual CREA LogEvents call are resolved server-side. Fire-and-forget:
   * responds 202 immediately without waiting on the CREA round-trip.
   *
   * Used for `view` (listing impression), `Click` (click-through) and
   * `email_realtor` (lead to the listing REALTOR) events.
   *
   * Deliberately unauthenticated — anonymous browsing must still be reported,
   * as required of a REAW-tier site. The protections are therefore CREA-01
   * (per-IP rate limit), CREA-02 (server-issued visitor id) and CREA-03 (the
   * listing must be one we actually serve), not an auth guard.
   */
  @Post('listing-event')
  @HttpCode(202)
  // CREA-01: far tighter than the global 100/min. This route fans out to CREA
  // under our DestinationId, so excess volume here costs us our data agreement
  // rather than just CPU. 30/min still comfortably covers a fast human.
  @Throttle({ default: { ttl: 60_000, limit: 30 } })
  @ApiOperation({ summary: 'Report a listing view/click/email_realtor event to CREA analytics' })
  async logListingEvent(
    @Body() dto: ListingEventDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ accepted: boolean }> {
    // CREA-01: with `trust proxy` set in main.ts this is the real client IP
    // rather than whatever the caller put in X-Forwarded-For.
    const ip = req.ip

    // CREA-02: the identity is ours to issue — dto.uuid is deliberately ignored.
    const uuid = resolveVisitorId(req, res)

    // CREA-03: logEvent resolves false when the listing isn't one we serve.
    const accepted = await this.crea.logEvent({
      listingId: dto.listingKey,
      eventType: dto.eventType,
      uuid,
      ip,
      referralUrl: dto.referralUrl,
      languageId: dto.languageId,
    })

    return { accepted }
  }
}
