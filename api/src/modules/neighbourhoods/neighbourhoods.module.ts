import { Module } from '@nestjs/common'
import { HttpModule } from '@nestjs/axios'
import { NeighbourhoodsController } from './neighbourhoods.controller'
import { NeighbourhoodsService } from './neighbourhoods.service'
import { PoiIngestionService } from './poi-ingestion.service'
import { GoogleMapsProxyService } from './google-maps-proxy.service'
import { WalkabilityService } from './scoring/walkability.service'
import { TransitService } from './scoring/transit.service'
import { SchoolsAmenitiesService } from './scoring/schools-amenities.service'
import { LivabilityService } from './scoring/livability.service'
import { PersonalizationService } from './scoring/personalization.service'
import { OptionalClerkAuthGuard } from '../../common/guards/optional-clerk-auth.guard'

@Module({
  imports: [HttpModule],
  controllers: [NeighbourhoodsController],
  providers: [
    NeighbourhoodsService,
    PoiIngestionService,
    GoogleMapsProxyService,
    WalkabilityService,
    TransitService,
    SchoolsAmenitiesService,
    LivabilityService,
    PersonalizationService,
    OptionalClerkAuthGuard,
  ],
  // Exported so batch/offline jobs (POI ingest + score computation) can be
  // driven from standalone scripts.
  exports: [PoiIngestionService, LivabilityService],
})
export class NeighbourhoodsModule {}
