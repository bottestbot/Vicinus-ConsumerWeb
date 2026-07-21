import { Body, Controller, HttpCode, Post, Req } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import type { Request } from 'express'
import { CreaAnalyticsService } from './crea-analytics.service'
import { ListingEventDto } from './dto/listing-event.dto'

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
   */
  @Post('listing-event')
  @HttpCode(202)
  @ApiOperation({ summary: 'Report a listing view/click/email_realtor event to CREA analytics' })
  logListingEvent(@Body() dto: ListingEventDto, @Req() req: Request): { accepted: true } {
    const ip =
      (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim() ||
      req.socket?.remoteAddress ||
      undefined

    this.crea.logEvent({
      listingId: dto.listingKey,
      eventType: dto.eventType,
      uuid: dto.uuid,
      ip,
      referralUrl: dto.referralUrl,
      languageId: dto.languageId,
    })

    return { accepted: true }
  }
}
