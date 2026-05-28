import { Injectable, Logger } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { PrismaService } from '../../prisma/prisma.service'
import { DdfPropertySync } from './ddf-property.sync'
import { DdfMemberSync } from './ddf-member.sync'
import { DdfOfficeSync } from './ddf-office.sync'
import { DdfOpenHouseSync } from './ddf-openhouse.sync'

@Injectable()
export class DdfSyncService {
  private readonly logger = new Logger(DdfSyncService.name)

  constructor(
    private prisma: PrismaService,
    private propertySync: DdfPropertySync,
    private memberSync: DdfMemberSync,
    private officeSync: DdfOfficeSync,
    private openHouseSync: DdfOpenHouseSync,
  ) {}

  @Cron('*/15 * * * *')
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

  @Cron(CronExpression.EVERY_HOUR)
  async syncMembersAndOffices() {
    this.logger.log('Starting member/office sync...')
    const lastSync = await this.getLastSync('Member')
    try {
      await this.officeSync.sync(lastSync ?? undefined)
      await this.memberSync.sync(lastSync ?? undefined)
      await this.openHouseSync.sync()
    } catch (err) {
      this.logger.error('Member/office sync failed', err)
    }
    await this.prisma.ddfSyncLog.create({
      data: { entity: 'Member', recordsSynced: 0, lastModifiedTimestamp: new Date(), status: 'success' },
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
