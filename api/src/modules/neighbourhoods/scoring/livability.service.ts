import { Injectable, Logger } from '@nestjs/common'
import { PrismaService } from '../../../prisma/prisma.service'
import { LatLng, ScorablePoi } from './geo'
import { WalkabilityService } from './walkability.service'
import { TransitService } from './transit.service'
import { SchoolsAmenitiesService } from './schools-amenities.service'
import { blendLivability, DEFAULT_WEIGHTS, SubScores, WEIGHTS_VERSION } from './blend'

// NBHD-07 — orchestrates the sub-scorers, blends them into the livability
// composite, ranks it against the reference pool, and persists the versioned
// result. Batch/offline job — never called in the request path (NBHD-09 reads
// the precomputed columns).
@Injectable()
export class LivabilityService {
  private readonly logger = new Logger(LivabilityService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly walkability: WalkabilityService,
    private readonly transit: TransitService,
    private readonly schoolsAmenities: SchoolsAmenitiesService,
  ) {}

  /** Compute + persist all sub-scores and the livability composite for one neighbourhood. */
  async computeAndSaveScores(neighbourhoodId: string): Promise<SubScores & { livability: number | null }> {
    const neighbourhood = await this.prisma.neighbourhood.findUnique({
      where: { id: neighbourhoodId },
      select: {
        id: true,
        city: true,
        province: true,
        lat: true,
        lng: true,
        centroidLat: true,
        centroidLng: true,
        referenceRegion: true,
      },
    })
    if (!neighbourhood) {
      throw new Error(`Neighbourhood ${neighbourhoodId} not found`)
    }

    const centroid = resolveCentroid(neighbourhood)
    if (!centroid) {
      this.logger.warn(`Neighbourhood ${neighbourhoodId} has no centroid — skipping scoring`)
      return { walkability: null, schools: null, amenities: null, transit: null, livability: null }
    }

    const pois = await this.loadLatestPois(neighbourhoodId)

    const walk = this.walkability.score(pois, centroid)
    const { schoolsScore, amenitiesScore } = this.schoolsAmenities.score(pois, centroid)
    const transitResult = await this.transit.score(centroid)

    const sub: SubScores = {
      walkability: walk.score,
      schools: schoolsScore,
      amenities: amenitiesScore,
      transit: transitResult.score,
    }
    const livability = blendLivability(sub, DEFAULT_WEIGHTS)

    // referenceRegion defaults to city ?? province when not explicitly set.
    const referenceRegion =
      neighbourhood.referenceRegion ?? neighbourhood.city ?? neighbourhood.province ?? null

    await this.prisma.neighbourhood.update({
      where: { id: neighbourhoodId },
      data: {
        walkabilityScore: sub.walkability,
        schoolsScore: sub.schools,
        amenitiesScore: sub.amenities,
        transitSubScore: sub.transit,
        livabilityScore: livability,
        livabilityWeightsVersion: WEIGHTS_VERSION,
        livabilityComputedAt: new Date(),
        referenceRegion,
      },
    })

    // Percentile depends on peers in the same region — recompute the whole pool.
    await this.recomputePercentiles(referenceRegion)

    return { ...sub, livability }
  }

  /** Batch: score every neighbourhood, then recompute all percentiles once scores exist. */
  async computeAllScores(): Promise<{ scored: number }> {
    const neighbourhoods = await this.prisma.neighbourhood.findMany({ select: { id: true } })
    let scored = 0
    for (const { id } of neighbourhoods) {
      try {
        await this.computeAndSaveScores(id)
        scored += 1
      } catch (err) {
        this.logger.warn(`Failed to score neighbourhood ${id}: ${(err as Error).message}`)
      }
    }
    // computeAndSaveScores already refreshes per-region percentiles, but run a
    // final global pass in case regions were only partially populated mid-batch.
    await this.recomputePercentiles(null)
    return { scored }
  }

  /**
   * Recompute "Top X%" percentile ranks. When `referenceRegion` is given, only
   * that pool is refreshed; when null, every region is refreshed. Percentile =
   * share of the pool this neighbourhood scores at-or-above (higher is better).
   */
  private async recomputePercentiles(referenceRegion: string | null): Promise<void> {
    const scoped = await this.prisma.neighbourhood.findMany({
      where: {
        livabilityScore: { not: null },
        ...(referenceRegion ? { referenceRegion } : {}),
      },
      select: { id: true, referenceRegion: true, livabilityScore: true },
    })

    // Group by region so percentiles are within-region.
    const byRegion = new Map<string, { id: string; score: number }[]>()
    for (const row of scoped) {
      const key = row.referenceRegion ?? '__none__'
      const list = byRegion.get(key) ?? []
      list.push({ id: row.id, score: row.livabilityScore as number })
      byRegion.set(key, list)
    }

    for (const list of byRegion.values()) {
      const total = list.length
      for (const item of list) {
        const atOrBelow = list.filter((o) => o.score <= item.score).length
        const percentile = total > 0 ? Math.round((atOrBelow / total) * 100) : null
        await this.prisma.neighbourhood.update({
          where: { id: item.id },
          data: { livabilityPercentile: percentile },
        })
      }
    }
  }

  private async loadLatestPois(neighbourhoodId: string): Promise<ScorablePoi[]> {
    // Use the most recent snapshot only, so a partial re-ingest doesn't mix versions.
    const latest = await this.prisma.neighbourhoodPoi.findFirst({
      where: { neighbourhoodId },
      orderBy: { createdAt: 'desc' },
      select: { snapshotVersion: true },
    })
    if (!latest) return []
    return this.prisma.neighbourhoodPoi.findMany({
      where: { neighbourhoodId, snapshotVersion: latest.snapshotVersion },
      select: { category: true, name: true, lat: true, lng: true },
    })
  }
}

function resolveCentroid(n: {
  lat: number | null
  lng: number | null
  centroidLat: number | null
  centroidLng: number | null
}): LatLng | null {
  const lat = n.centroidLat ?? n.lat
  const lng = n.centroidLng ?? n.lng
  if (lat == null || lng == null) return null
  return { lat, lng }
}
