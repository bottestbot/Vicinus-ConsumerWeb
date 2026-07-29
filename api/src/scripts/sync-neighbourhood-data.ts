// One-off data sync: copies computed neighbourhood data from a source DB
// (typically local, where scoring ran with GTFS files available) into a
// target DB (typically prod, which has no GTFS and no scheduled scoring).
//
// Neighbourhood IDs are random UUIDs and differ between environments, so rows
// are matched on the unique `slug`. For each match this copies:
//   - computed score columns (livability/walkability/transit/schools/amenities,
//     percentile, weights version, computedAt)
//   - geographic truth (boundary, centroidLat/Lng, referenceRegion)
//   - all NeighbourhoodPoi rows, remapped to the target neighbourhood id
//     (delete-then-insert per neighbourhood, so reruns are idempotent)
//
//   SOURCE_DATABASE_URL=postgres://... TARGET_DATABASE_URL=postgres://... \
//     npx ts-node --transpile-only src/scripts/sync-neighbourhood-data.ts [--dry-run]

import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const POI_INSERT_CHUNK = 5000

async function main() {
  const sourceUrl = process.env.SOURCE_DATABASE_URL
  const targetUrl = process.env.TARGET_DATABASE_URL
  if (!sourceUrl || !targetUrl) {
    throw new Error('Set both SOURCE_DATABASE_URL and TARGET_DATABASE_URL.')
  }
  if (sourceUrl === targetUrl) {
    throw new Error('SOURCE_DATABASE_URL and TARGET_DATABASE_URL are identical — refusing to sync a DB onto itself.')
  }
  const dryRun = process.argv.includes('--dry-run')

  const sourcePool = new Pool({ connectionString: sourceUrl })
  const targetPool = new Pool({ connectionString: targetUrl })
  const source = new PrismaClient({ adapter: new PrismaPg(sourcePool) })
  const target = new PrismaClient({ adapter: new PrismaPg(targetPool) })

  try {
    const sourceRows = await source.neighbourhood.findMany({
      where: { livabilityScore: { not: null } },
      select: {
        id: true,
        slug: true,
        livabilityScore: true,
        walkabilityScore: true,
        transitSubScore: true,
        schoolsScore: true,
        amenitiesScore: true,
        livabilityPercentile: true,
        livabilityWeightsVersion: true,
        livabilityComputedAt: true,
        boundary: true,
        centroidLat: true,
        centroidLng: true,
        referenceRegion: true,
      },
    })
    const targetRows = await target.neighbourhood.findMany({ select: { id: true, slug: true } })
    const targetBySlug = new Map(targetRows.map((n) => [n.slug, n.id]))

    const matched = sourceRows.filter((n) => targetBySlug.has(n.slug))
    const unmatched = sourceRows.filter((n) => !targetBySlug.has(n.slug))
    console.log(
      `Source: ${sourceRows.length} scored neighbourhoods · target matches ${matched.length}, ` +
        `no target row for ${unmatched.length}`,
    )
    if (unmatched.length > 0) {
      console.log(`  unmatched slugs: ${unmatched.map((n) => n.slug).join(', ')}`)
    }
    if (dryRun) {
      const poiCount = await source.neighbourhoodPoi.count({
        where: { neighbourhoodId: { in: matched.map((n) => n.id) } },
      })
      console.log(`Dry run — would copy scores for ${matched.length} neighbourhoods and ${poiCount} POIs.`)
      return
    }

    let synced = 0
    let poisCopied = 0
    for (const src of matched) {
      const targetId = targetBySlug.get(src.slug)!

      await target.neighbourhood.update({
        where: { id: targetId },
        data: {
          livabilityScore: src.livabilityScore,
          walkabilityScore: src.walkabilityScore,
          transitSubScore: src.transitSubScore,
          schoolsScore: src.schoolsScore,
          amenitiesScore: src.amenitiesScore,
          livabilityPercentile: src.livabilityPercentile,
          livabilityWeightsVersion: src.livabilityWeightsVersion,
          livabilityComputedAt: src.livabilityComputedAt,
          // Prisma Json columns reject plain null on write; DbNull clears the column.
          boundary: src.boundary === null ? undefined : src.boundary,
          centroidLat: src.centroidLat,
          centroidLng: src.centroidLng,
          referenceRegion: src.referenceRegion,
        },
      })

      const pois = await source.neighbourhoodPoi.findMany({
        where: { neighbourhoodId: src.id },
        select: { osmId: true, category: true, name: true, lat: true, lng: true, snapshotVersion: true },
      })
      await target.neighbourhoodPoi.deleteMany({ where: { neighbourhoodId: targetId } })
      for (let i = 0; i < pois.length; i += POI_INSERT_CHUNK) {
        await target.neighbourhoodPoi.createMany({
          data: pois.slice(i, i + POI_INSERT_CHUNK).map((p) => ({ ...p, neighbourhoodId: targetId })),
        })
      }
      poisCopied += pois.length
      synced += 1
      if (synced % 50 === 0) console.log(`  ${synced}/${matched.length} synced (${poisCopied} POIs so far)...`)
    }

    console.log(`Done: ${synced} neighbourhoods synced, ${poisCopied} POIs copied.`)
  } finally {
    await source.$disconnect()
    await target.$disconnect()
    await sourcePool.end()
    await targetPool.end()
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
