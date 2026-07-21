import { Module } from '@nestjs/common'
import { APP_GUARD } from '@nestjs/core'
import { ConfigModule } from '@nestjs/config'
import { ScheduleModule } from '@nestjs/schedule'
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler'
import { PrismaModule } from './prisma/prisma.module'
import { RedisModule } from './common/redis/redis.module'
import { DdfSyncModule } from './modules/ddf-sync/ddf-sync.module'
import { PropertiesModule } from './modules/properties/properties.module'
import { SearchModule } from './modules/search/search.module'
import { AnalyticsModule } from './modules/analytics/analytics.module'
import { UsersModule } from './modules/users/users.module'
import { AlertsModule } from './modules/alerts/alerts.module'
import { OpenHouseVisitsModule } from './modules/open-house-visits/open-house-visits.module'
import { NeighbourhoodsModule } from './modules/neighbourhoods/neighbourhoods.module'
import { AgentsModule } from './modules/agents/agents.module'
import { EditorialModule } from './modules/editorial/editorial.module'
import { AuthModule } from './modules/auth/auth.module'
import { AiModule } from './modules/ai/ai.module'
import { SellModule } from './modules/sell/sell.module'
import { WaitlistModule } from './modules/waitlist/waitlist.module'
import { HealthModule } from './modules/health/health.module'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    // CREA-01: baseline rate limit for every route. Endpoints that need a
    // tighter budget narrow it locally with @Throttle — see AnalyticsController,
    // which forwards to CREA under our DestinationId and so must not be
    // abusable. Requires `trust proxy` in main.ts to key on the real client IP.
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
    PrismaModule,
    // BE-305: global Redis service — used by SearchService for 2-min search cache
    // and map-pins 5-min cache.  RedisModule is @Global() so any module can inject
    // RedisService without re-importing it.
    RedisModule,
    AuthModule,
    UsersModule,
    AlertsModule,
    OpenHouseVisitsModule,
    PropertiesModule,
    SearchModule,
    AnalyticsModule,
    NeighbourhoodsModule,
    AgentsModule,
    EditorialModule,
    DdfSyncModule,
    AiModule,
    SellModule,
    WaitlistModule,
    HealthModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
