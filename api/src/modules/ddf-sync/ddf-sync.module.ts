import { Module } from '@nestjs/common'
import { HttpModule } from '@nestjs/axios'
import { DdfSyncService } from './ddf-sync.service'
import { DdfAuthService } from './ddf-auth.service'
import { DdfPropertySync } from './ddf-property.sync'
import { DdfMemberSync } from './ddf-member.sync'
import { DdfOfficeSync } from './ddf-office.sync'
import { DdfOpenHouseSync } from './ddf-openhouse.sync'
import { SearchModule } from '../search/search.module'

@Module({
  imports: [
    HttpModule,
    // BE-303: AlgoliaService (exported from SearchModule) is injected into
    // DdfPropertySync so every property upsert is mirrored to the Algolia index.
    SearchModule,
  ],
  providers: [DdfSyncService, DdfAuthService, DdfPropertySync, DdfMemberSync, DdfOfficeSync, DdfOpenHouseSync],
  exports: [DdfAuthService],
})
export class DdfSyncModule {}
