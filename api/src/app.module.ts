import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { ScheduleModule } from '@nestjs/schedule'
import { PrismaModule } from './prisma/prisma.module'
import { DdfSyncModule } from './modules/ddf-sync/ddf-sync.module'
import { PropertiesModule } from './modules/properties/properties.module'
import { SearchModule } from './modules/search/search.module'
import { UsersModule } from './modules/users/users.module'
import { NeighbourhoodsModule } from './modules/neighbourhoods/neighbourhoods.module'
import { AgentsModule } from './modules/agents/agents.module'
import { EditorialModule } from './modules/editorial/editorial.module'
import { AuthModule } from './modules/auth/auth.module'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    UsersModule,
    PropertiesModule,
    SearchModule,
    NeighbourhoodsModule,
    AgentsModule,
    EditorialModule,
    DdfSyncModule,
  ],
})
export class AppModule {}
