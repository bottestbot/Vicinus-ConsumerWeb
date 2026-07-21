import { Injectable, Logger } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { PrismaService } from '../../prisma/prisma.service'
import { DdfPropertySync } from './ddf-property.sync'
import { DdfMemberSync } from './ddf-member.sync'
import { DdfOfficeSync } from './ddf-office.sync'
import { DdfOpenHouseSync } from './ddf-openhouse.sync'
import { DdfReconciliationSync } from './ddf-reconciliation.sync'

/**
 * BE-811: `scheduledSync` runs `syncProperties()` and the open-house sync every
 * 15 minutes to keep the local DB fresh enough for Alert generation
 * (BE-802/803/804/806) to diff new/changed rows against. Search itself still
 * queries the DDF API live on demand and does not depend on this cron —
 * this sync exists purely to feed Alert generation. `syncMembersAndOffices()`
 * remains on its own manually-triggered cadence and no longer chains the
 * open-house sync (it now runs independently, more frequently, on the cron
 * below) to avoid redundant double-syncing.
 */
@Injectable()
export class DdfSyncService {
  private readonly logger = new Logger(DdfSyncService.name)

  constructor(
    private prisma: PrismaService,
    private propertySync: DdfPropertySync,
    private memberSync: DdfMemberSync,
    private officeSync: DdfOfficeSync,
    private openHouseSync: DdfOpenHouseSync,
    private reconciliationSync: DdfReconciliationSync,
  ) {}

  async syncProperties() {
    this.logger.log('Starting property sync...')
    const lastSync = await this.getLastSync('Property')
    let recordsSynced = 0
    let status = 'success'
    let errorMessage: string | undefined

    try {
      recordsSynced = await this.propertySync.sync(lastSync ?? undefined)
    } catch (err) {
      status = 'error'
      errorMessage = (err as Error).message
      this.logger.error('Property sync failed', err)
    }

    await this.prisma.ddfSyncLog.create({
      data: { entity: 'Property', recordsSynced, lastModifiedTimestamp: new Date(), status, errorMessage },
    })
  }

  // BE-Task#9: brokerage/agent attribution must stay fresh, so the member/office
  // sync now runs on its own daily cron (previously manual-only). Kept off the
  // 15-min property cadence — agents/offices change far less often than listings.
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async syncMembersAndOffices() {
    this.logger.log('Starting member/office sync...')
    const lastSync = await this.getLastSync('Member')
    try {
      await this.officeSync.sync(lastSync ?? undefined)
      await this.memberSync.sync(lastSync ?? undefined)
    } catch (err) {
      this.logger.error('Member/office sync failed', err)
    }
    await this.prisma.ddfSyncLog.create({
      data: { entity: 'Member', recordsSynced: 0, lastModifiedTimestamp: new Date(), status: 'success' },
    })
  }

  @Cron('*/15 * * * *')
  async scheduledSync() {
    this.logger.log('Scheduled sync tick starting...')

    try {
      await this.syncProperties()
    } catch (err) {
      this.logger.error('Scheduled property sync failed', err)
    }

    try {
      await this.openHouseSync.sync()
      await this.prisma.ddfSyncLog.create({
        data: { entity: 'OpenHouse', recordsSynced: 0, lastModifiedTimestamp: new Date(), status: 'success' },
      })
    } catch (err) {
      this.logger.error('Scheduled open-house sync failed', err)
      await this.prisma.ddfSyncLog.create({
        data: { entity: 'OpenHouse', recordsSynced: 0, status: 'error', errorMessage: (err as Error).message },
      })
    }
  }

  // BE-Task#1: DDF requires deleting listings that fall off the authoritative
  // PropertyReplication() master list (sold/cancelled/off-market). Runs once
  // daily — separate from the 15-min incremental upsert sync above.
  @Cron(CronExpression.EVERY_DAY_AT_4AM)
  async reconcileListings() {
    this.logger.log('Starting replication reconciliation...')
    let status = 'success'
    let errorMessage: string | undefined
    let deletedCount = 0

    try {
      const result = await this.reconciliationSync.reconcile()
      deletedCount = result.deletedCount
      // CREA-07d: a run that refused to delete must not look like a healthy
      // one — otherwise a permanently-skipping reconciliation is invisible and
      // we quietly go back to advertising sold listings.
      if (result.skippedReason) {
        status = 'skipped'
        errorMessage = `${result.skippedReason}: ${result.staleCount} stale of ${result.masterCount} live not deleted`
        this.logger.warn(`Reconciliation skipped (${result.skippedReason})`)
      }
    } catch (err) {
      status = 'error'
      errorMessage = (err as Error).message
      this.logger.error('Replication reconciliation failed', err)
    }

    await this.prisma.ddfSyncLog.create({
      data: {
        entity: 'PropertyReplication',
        recordsSynced: deletedCount,
        lastModifiedTimestamp: new Date(),
        status,
        errorMessage,
      },
    })
  }

  private async getLastSync(entity: string): Promise<Date | null> {
    const log = await this.prisma.ddfSyncLog.findFirst({
      where: { entity, status: 'success' },
      orderBy: { syncedAt: 'desc' },
    })
    return log?.lastModifiedTimestamp ?? null
  }
}
