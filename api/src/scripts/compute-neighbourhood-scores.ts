import 'reflect-metadata'
import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { NestFactory } from '@nestjs/core'
import { PrismaModule } from '../prisma/prisma.module'
import { RedisModule } from '../common/redis/redis.module'
import { PrismaService } from '../prisma/prisma.service'
import { RedisService } from '../common/redis/redis.service'
import { NeighbourhoodsModule } from '../modules/neighbourhoods/neighbourhoods.module'
import { PoiIngestionService } from '../modules/neighbourhoods/poi-ingestion.service'
import { LivabilityService } from '../modules/neighbourhoods/scoring/livability.service'

// NBHD-02/04/06/07 batch runner — ingests OSM POIs then computes and persists
// livability scores for every neighbourhood. Offline job: the /detail endpoint
// only ever reads the precomputed columns this writes.
//
//   npm run scores:neighbourhoods              # ingest POIs + score
//   npm run scores:neighbourhoods -- --skip-ingest   # rescore existing POIs only
//
// Overpass is a shared free endpoint and the ingest is deliberately paced, so a
// full run takes roughly a second and a half per neighbourhood.

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    RedisModule,
    NeighbourhoodsModule,
  ],
})
class ScoringAppModule {}

async function main() {
  const skipIngest = process.argv.includes('--skip-ingest')

  const app = await NestFactory.createApplicationContext(ScoringAppModule, {
    logger: ['log', 'warn', 'error'],
  })

  const prisma = app.get(PrismaService)
  const redis = app.get(RedisService)
  const poiIngestion = app.get(PoiIngestionService)
  const livability = app.get(LivabilityService)

  const total = await prisma.neighbourhood.count()
  if (total === 0) {
    console.log('No neighbourhoods found — seed them first (npm run db:seed:neighbourhoods).')
    await app.close()
    return
  }

  // Scoring is anchored on a centroid; without coordinates a neighbourhood is skipped.
  const withoutCoords = await prisma.neighbourhood.count({
    where: { AND: [{ centroidLat: null }, { lat: null }] },
  })
  if (withoutCoords > 0) {
    console.warn(
      `${withoutCoords}/${total} neighbourhoods have no coordinates and will be skipped ` +
        `(run src/scripts/backfill-neighbourhood-coords.ts first).`,
    )
  }

  if (!skipIngest) {
    console.log(`Ingesting OSM POIs for ${total} neighbourhoods...`)
    const { total: poiCount } = await poiIngestion.ingestAllNeighbourhoods()
    console.log(`Ingested ${poiCount} POIs.`)
  } else {
    console.log('Skipping POI ingest (--skip-ingest).')
  }

  console.log('Computing livability scores...')
  const { scored, skipped, failed } = await livability.computeAllScores()
  console.log(`Scored ${scored}/${total} neighbourhoods (${skipped} unrated, ${failed} errored).`)

  // Precomputed values just changed — drop the cached detail payloads so the
  // endpoint doesn't serve stale scores for up to 30 minutes.
  await redis.delPattern('neighbourhood:*')

  const ranked = await prisma.neighbourhood.findMany({
    where: { livabilityScore: { not: null } },
    select: {
      name: true,
      referenceRegion: true,
      livabilityScore: true,
      livabilityPercentile: true,
      walkabilityScore: true,
      schoolsScore: true,
      amenitiesScore: true,
      transitSubScore: true,
    },
    orderBy: { livabilityScore: 'desc' },
    take: 10,
  })

  console.log('\n=== Top neighbourhoods by livability ===')
  for (const n of ranked) {
    console.log(
      `${n.livabilityScore?.toFixed(1).padStart(5)}  ` +
        `p${String(n.livabilityPercentile ?? '—').padStart(3)}  ` +
        `walk ${fmt(n.walkabilityScore)} schools ${fmt(n.schoolsScore)} ` +
        `amen ${fmt(n.amenitiesScore)} transit ${fmt(n.transitSubScore)}  ` +
        `${n.name} (${n.referenceRegion ?? 'no region'})`,
    )
  }
  if (ranked.length === 0) {
    console.log('(none scored — check the coordinate warning above)')
  }

  await app.close()
}

function fmt(n: number | null): string {
  return (n == null ? '—' : n.toFixed(0)).padStart(3)
}

main().catch((err) => {
  console.error('Neighbourhood scoring failed:', err)
  process.exit(1)
})
