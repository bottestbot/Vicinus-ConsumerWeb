import 'reflect-metadata'
import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { NestFactory } from '@nestjs/core'
import { PrismaModule } from '../prisma/prisma.module'
import { RedisModule } from '../common/redis/redis.module'
import { PrismaService } from '../prisma/prisma.service'
import { NeighbourhoodsModule } from '../modules/neighbourhoods/neighbourhoods.module'
import { PoiIngestionService } from '../modules/neighbourhoods/poi-ingestion.service'

// Targeted POI re-ingest for a single neighbourhood — used to verify ingestion
// changes (e.g. the transit-station tags) against one area without a full
// hours-long batch, and to refresh a specific neighbourhood on demand.
// LOCAL ONLY, like all ingestion (see the neighbourhood-score sync playbook):
// prod receives POI rows via sync-neighbourhood-data.ts.
//
//   npm run ingest:pois -- <slug> [radiusM]
//   npm run ingest:pois -- surrey-city-centre
//   npm run ingest:pois -- shaughnessy 2000

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    RedisModule,
    NeighbourhoodsModule,
  ],
})
class IngestAppModule {}

async function main() {
  const [slug, radiusArg] = process.argv.slice(2).filter((a) => !a.startsWith('-'))
  if (!slug) {
    console.error('Usage: npm run ingest:pois -- <slug> [radiusM]')
    process.exit(1)
  }
  const radius = radiusArg ? Number(radiusArg) : undefined
  if (radiusArg && (!Number.isFinite(radius) || (radius as number) <= 0)) {
    console.error(`Invalid radius "${radiusArg}"`)
    process.exit(1)
  }

  const app = await NestFactory.createApplicationContext(IngestAppModule, {
    logger: ['log', 'warn', 'error'],
  })
  const prisma = app.get(PrismaService)
  const poiIngestion = app.get(PoiIngestionService)

  try {
    const neighbourhood = await prisma.neighbourhood.findUnique({
      where: { slug },
      select: { id: true, name: true, city: true },
    })
    if (!neighbourhood) {
      console.error(`Neighbourhood "${slug}" not found.`)
      process.exitCode = 1
      return
    }

    console.log(`Ingesting POIs for ${neighbourhood.name} (${neighbourhood.city})…`)
    const count = await poiIngestion.ingestPoisForNeighbourhood(neighbourhood.id, radius)

    // Report the snapshot that was just written (older quarters may linger).
    const latest = await prisma.neighbourhoodPoi.findFirst({
      where: { neighbourhoodId: neighbourhood.id },
      orderBy: { createdAt: 'desc' },
      select: { snapshotVersion: true },
    })
    const byCategory = await prisma.neighbourhoodPoi.groupBy({
      by: ['category'],
      where: { neighbourhoodId: neighbourhood.id, snapshotVersion: latest?.snapshotVersion },
      _count: { _all: true },
    })
    console.log(`Stored ${count} POIs:`)
    for (const row of byCategory.sort((a, b) => b._count._all - a._count._all)) {
      console.log(`  ${row.category}: ${row._count._all}`)
    }
  } finally {
    await app.close()
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
