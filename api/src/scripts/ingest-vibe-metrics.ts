import 'reflect-metadata'
import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { NestFactory } from '@nestjs/core'
import { PrismaModule } from '../prisma/prisma.module'
import { RedisModule } from '../common/redis/redis.module'
import { PrismaService } from '../prisma/prisma.service'
import { RedisService } from '../common/redis/redis.service'
import { NeighbourhoodsModule } from '../modules/neighbourhoods/neighbourhoods.module'
import { VibeMetricsService } from '../modules/neighbourhoods/vibe-metrics.service'

// VIBE-01 batch runner — ingests OSM "vibe" inputs (bike infra, green cover,
// noise-source proximity) for every neighbourhood and persists the summary
// metrics onto the Neighbourhood row. Offline job, independent of scoring.
//
//   npm run vibe:neighbourhoods                    # ingest all
//   npm run vibe:neighbourhoods -- --only-missing  # only those never ingested
//
// Overpass is a shared free endpoint and the ingest is deliberately paced, so a
// full run takes a couple of seconds per neighbourhood.

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    RedisModule,
    NeighbourhoodsModule,
  ],
})
class VibeAppModule {}

async function main() {
  const onlyMissing = process.argv.includes('--only-missing')

  const app = await NestFactory.createApplicationContext(VibeAppModule, {
    logger: ['log', 'warn', 'error'],
  })

  const prisma = app.get(PrismaService)
  const redis = app.get(RedisService)
  const vibe = app.get(VibeMetricsService)

  const total = await prisma.neighbourhood.count()
  if (total === 0) {
    console.log('No neighbourhoods found — seed them first (npm run db:seed:neighbourhoods).')
    await app.close()
    return
  }

  const withoutCoords = await prisma.neighbourhood.count({
    where: { AND: [{ centroidLat: null }, { lat: null }] },
  })
  if (withoutCoords > 0) {
    console.warn(
      `${withoutCoords}/${total} neighbourhoods have no coordinates and will be skipped ` +
        `(run src/scripts/backfill-neighbourhood-coords.ts first).`,
    )
  }

  const target = onlyMissing
    ? await prisma.neighbourhood.count({ where: { vibeMetricsComputedAt: null } })
    : total
  console.log(
    onlyMissing
      ? `Ingesting vibe metrics for ${target} neighbourhoods with none yet...`
      : `Ingesting vibe metrics for ${total} neighbourhoods...`,
  )

  const { total: done, failed } = await vibe.ingestAllNeighbourhoods(undefined, { onlyMissing })
  console.log(`Vibe metrics ingested for ${done} neighbourhoods. ${failed.length} failed.`)

  // Detail payloads may surface these — drop the cache so it doesn't serve stale.
  await redis.delPattern('neighbourhood:*')

  const ranked = await prisma.neighbourhood.findMany({
    where: { vibeMetricsComputedAt: { not: null } },
    select: {
      name: true,
      bikeLaneKm: true,
      greenCoverPct: true,
      nearestMajorRoadM: true,
    },
    orderBy: { greenCoverPct: 'desc' },
    take: 10,
  })

  console.log('\n=== Greenest neighbourhoods (vibe sample) ===')
  for (const n of ranked) {
    console.log(
      `${fmt(n.greenCoverPct)}% green  ${fmt(n.bikeLaneKm)}km bike  ` +
        `road ${n.nearestMajorRoadM == null ? '—' : `${n.nearestMajorRoadM}m`}  ${n.name}`,
    )
  }
  if (ranked.length === 0) {
    console.log('(none ingested — check the coordinate warning above)')
  }

  await app.close()
}

function fmt(n: number | null): string {
  return (n == null ? '—' : String(n)).padStart(5)
}

main().catch((err) => {
  console.error('Vibe metrics ingest failed:', err)
  process.exit(1)
})
