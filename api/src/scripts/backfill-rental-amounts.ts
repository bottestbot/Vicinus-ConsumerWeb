import 'reflect-metadata'
import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { HttpModule, HttpService } from '@nestjs/axios'
import { NestFactory } from '@nestjs/core'
import { firstValueFrom } from 'rxjs'
import { PrismaModule } from '../prisma/prisma.module'
import { PrismaService } from '../prisma/prisma.service'
import { RedisModule } from '../common/redis/redis.module'
import { DdfSyncModule } from '../modules/ddf-sync/ddf-sync.module'
import { DdfAuthService } from '../modules/ddf-sync/ddf-auth.service'

// RENT-03 backfill — one-off repair for rows synced before the DDF→Prisma
// mapper learned about `TotalActualRent`.
//
// Residential rentals put their rent in `TotalActualRent`; only commercial
// leases use `LeaseAmount`. `ddf-property.sync.ts` mapped `LeaseAmount` alone,
// so every synced residential rental landed with price AND leaseAmount null —
// which the DB-backed surfaces (neighbourhood detail, saved-search matcher)
// render as "Price on request". The mapper is fixed, but the incremental sync
// keys off ModificationTimestamp, so existing rows stay null until a listing
// happens to change upstream. This backfills them directly.
//
//   npm run backfill:rents -- --dry-run   # report only, no writes
//   npm run backfill:rents                # apply
//
// Narrow $select and a rental-only $filter keep this far cheaper than a full
// resync. Safe to re-run: it only ever fills rows whose leaseAmount is null.

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    HttpModule.register({ timeout: 60_000 }),
    PrismaModule,
    RedisModule,
    DdfSyncModule,
  ],
})
class BackfillAppModule {}

// DDF rejects $top above 100 ("The limit of '100' for Top query has been
// exceeded") — this is the ceiling, not a politeness setting.
const PAGE_SIZE = 100

async function main() {
  const dryRun = process.argv.includes('--dry-run')

  const app = await NestFactory.createApplicationContext(BackfillAppModule, {
    logger: ['warn', 'error'],
  })

  const prisma = app.get(PrismaService)
  const http = app.get(HttpService)
  const config = app.get(ConfigService)
  const auth = app.get(DdfAuthService)

  const before = await prisma.property.count({
    where: { status: 'Active', price: null, leaseAmount: null },
  })
  console.log(`${before} active listings currently have no price and no leaseAmount.`)
  if (dryRun) console.log('(dry run — nothing will be written)\n')

  const token = await auth.getToken()
  const baseUrl = config.get<string>('DDF_API_BASE_URL')
  const select = 'ListingKey,TotalActualRent,LeaseAmount,LeaseAmountFrequency'
  let url =
    `${baseUrl}/Property?$top=${PAGE_SIZE}` +
    `&$select=${select}` +
    `&$filter=${encodeURIComponent('TotalActualRent ne null')}`

  let seen = 0
  let updated = 0
  let pages = 0

  while (url) {
    const response = await firstValueFrom(
      http.get(url, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      }),
    )

    const rows = (response.data.value as Record<string, unknown>[]) || []
    seen += rows.length
    pages++

    for (const r of rows) {
      const key = String(r['ListingKey'])
      const amount = (r['LeaseAmount'] ?? r['TotalActualRent']) as number | null
      if (amount == null) continue

      if (!dryRun) {
        // `leaseAmount: null` in the predicate is deliberate — never overwrite
        // an amount another path already resolved, and it makes re-runs cheap.
        const result = await prisma.property.updateMany({
          where: { ddfListingKey: key, leaseAmount: null },
          data: {
            leaseAmount: amount,
            leaseFrequency: (r['LeaseAmountFrequency'] as string | null) ?? undefined,
          },
        })
        updated += result.count
      } else {
        const match = await prisma.property.count({
          where: { ddfListingKey: key, leaseAmount: null },
        })
        updated += match
      }
    }

    console.log(`  page ${pages}: ${seen} DDF rentals scanned, ${updated} rows ${dryRun ? 'would be ' : ''}updated`)
    url = (response.data['@odata.nextLink'] as string) || ''
  }

  const after = await prisma.property.count({
    where: { status: 'Active', price: null, leaseAmount: null },
  })

  console.log('\n=== RENT-03 backfill ===')
  console.log(`DDF rentals scanned:      ${seen}`)
  console.log(`Rows ${dryRun ? 'that would be ' : ''}updated:  ${updated}`)
  console.log(`Priceless active before:  ${before}`)
  console.log(`Priceless active after:   ${after}`)

  await app.close()
}

main().catch((err) => {
  const body = (err as { response?: { data?: unknown } }).response?.data
  console.error('Backfill failed:', (err as Error).message)
  if (body) console.error('DDF said:', JSON.stringify(body, null, 2))
  process.exit(1)
})
