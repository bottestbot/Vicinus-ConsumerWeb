import { Module } from '@nestjs/common'
import { HttpModule } from '@nestjs/axios'
import { DdfSyncService } from './ddf-sync.service'
import { DdfAuthService } from './ddf-auth.service'
import { DdfPropertySync } from './ddf-property.sync'
import { DdfMemberSync } from './ddf-member.sync'
import { DdfOfficeSync } from './ddf-office.sync'
import { DdfOpenHouseSync } from './ddf-openhouse.sync'
import { DdfReconciliationSync } from './ddf-reconciliation.sync'
import { SearchModule } from '../search/search.module'
import { AlertsModule } from '../alerts/alerts.module'

@Module({
  imports: [
    HttpModule,
    // BE-303: AlgoliaService (exported from SearchModule) is injected into
    // DdfPropertySync so every property upsert is mirrored to the Algolia index.
    SearchModule,
    // BE-802/803/804/806: AlertsService is injected into DdfPropertySync/
    // DdfOpenHouseSync to generate alerts right after each upsert.
    AlertsModule,
  ],
  providers: [
    DdfSyncService,
    DdfAuthService,
    DdfPropertySync,
    DdfMemberSync,
    DdfOfficeSync,
    DdfOpenHouseSync,
    DdfReconciliationSync,
  ],
  exports: [DdfAuthService],
})
export class DdfSyncModule {}
