import { Module } from '@nestjs/common'
import { HttpModule } from '@nestjs/axios'
import { AnalyticsController } from './analytics.controller'
import { CreaAnalyticsService } from './crea-analytics.service'

/**
 * CREA DDF analytics (Task #2). Exposes `POST /analytics/listing-event` and the
 * {@link CreaAnalyticsService} client used to report listing view / click /
 * email_realtor events back to CREA's LogEvents service.
 */
@Module({
  imports: [HttpModule],
  controllers: [AnalyticsController],
  providers: [CreaAnalyticsService],
  exports: [CreaAnalyticsService],
})
export class AnalyticsModule {}
