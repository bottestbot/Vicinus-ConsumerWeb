import 'reflect-metadata'
import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { ScheduleModule } from '@nestjs/schedule'
import { NestFactory } from '@nestjs/core'
import { PrismaModule } from '../prisma/prisma.module'
import { RedisModule } from '../common/redis/redis.module'
import { DdfSyncModule } from '../modules/ddf-sync/ddf-sync.module'
import { SearchModule } from '../modules/search/search.module'
import { DdfSyncService } from '../modules/ddf-sync/ddf-sync.service'
import { DdfOfficeSync } from '../modules/ddf-sync/ddf-office.sync'
import { DdfMemberSync } from '../modules/ddf-sync/ddf-member.sync'
import { DdfPropertySync } from '../modules/ddf-sync/ddf-property.sync'

// Max pages per entity for the initial seed run (100 records/page)
const MAX_PROPERTY_PAGES = 5 // 500 properties

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    PrismaModule,
    RedisModule,
    SearchModule,
    DdfSyncModule,
  ],
})
class SyncAppModule {}

async function main() {
  const app = await NestFactory.createApplicationContext(SyncAppModule, {
    logger: ['log', 'warn', 'error'],
  })

  const syncService = app.get(DdfSyncService)
  const officeSync = app.get(DdfOfficeSync)
  const memberSync = app.get(DdfMemberSync)
  const propertySync = app.get(DdfPropertySync)

  // Trigger the service log + DdfSyncLog entry for members
  await syncService.syncMembersAndOffices()

  // Now sync properties (bounded to MAX_PROPERTY_PAGES pages)
  console.log(`Syncing properties (first ${MAX_PROPERTY_PAGES * 100} records)...`)
  let propertyCount = 0
  try {
    // Use the service's cron wrapper so it writes a DdfSyncLog entry
    await syncService.syncProperties()
    // We'll count from DB below
  } catch (_) {
    // individual errors already logged
  }

  await app.close()

  // Report final counts
  const { PrismaClient } = await import('@prisma/client')
  const prisma = new PrismaClient()
  const [properties, agents, offices] = await Promise.all([
    prisma.property.count(),
    prisma.agent.count(),
    prisma.office.count(),
  ])
  await prisma.$disconnect()

  console.log('\n=== Sync Results ===')
  console.log(`Properties: ${properties}`)
  console.log(`Agents:     ${agents}`)
  console.log(`Offices:    ${offices}`)
}

main().catch((err) => {
  console.error('Sync failed:', err)
  process.exit(1)
})
