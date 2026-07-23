import { Module } from '@nestjs/common'
import { HealthController } from './health.controller'
import { SearchModule } from '../search/search.module'

@Module({
  // SearchModule exports DdfQueryService, used by the /health/ddf probe.
  imports: [SearchModule],
  controllers: [HealthController],
})
export class HealthModule {}
