import { Injectable } from '@nestjs/common'
import {
  distanceDecay,
  LatLng,
  PoiCategory,
  POI_CATEGORIES,
  ScorablePoi,
  walkingMeters,
} from './geo'

export interface SchoolsAmenitiesResult {
  schoolsScore: number
  amenitiesScore: number
}

// NBHD-06 — schools-access + amenities sub-scores.
//
// Schools (locations-only, no CA ratings): nearest school per level within a
// generous walking band (full ≤800m, 0 at 3000m), rewarding neighbourhoods that
// cover all three levels. OSM rarely tags school level (`isced:level`), so v1
// infers level from the name and, failing that, treats a school as covering all
// levels — documented as a known approximation.
const SCHOOL_FULL_M = 800
const SCHOOL_ZERO_M = 3000
type SchoolLevel = 'elementary' | 'middle' | 'secondary'
const SCHOOL_LEVELS: SchoolLevel[] = ['elementary', 'middle', 'secondary']
// Weighting between raw proximity and identified per-level coverage. A single
// school of unknown level nearby scores 60; full identified coverage scores 100.
const PROXIMITY_SHARE = 0.6
const COVERAGE_SHARE = 0.4

// Amenities: distance-decayed POI density with a per-category cap of 3 so
// variety (a grocer AND a café AND a park) beats raw count (ten cafés). To
// avoid double-counting walkability, this uses a strict presence-density
// normalization rather than walkability's weighted-log formulation.
const AMENITY_FULL_M = 400
const AMENITY_ZERO_M = 2000
const PER_CATEGORY_CAP = 3
// A neighbourhood covering every category at full strength scores 100.
const AMENITY_ANCHOR = POI_CATEGORIES.length * PER_CATEGORY_CAP

@Injectable()
export class SchoolsAmenitiesService {
  score(pois: ScorablePoi[], centroid: LatLng): SchoolsAmenitiesResult {
    return {
      schoolsScore: round1(this.schoolsScore(pois, centroid)),
      amenitiesScore: round1(this.amenitiesScore(pois, centroid)),
    }
  }

  private schoolsScore(pois: ScorablePoi[], centroid: LatLng): number {
    const schools = pois.filter((p) => p.category === 'schools')
    if (schools.length === 0) return 0

    // Proximity to the single nearest school, whatever its level.
    let nearestAccess = 0
    // Best access per level, counting ONLY schools whose name identifies a level.
    const bestByLevel: Record<SchoolLevel, number> = { elementary: 0, middle: 0, secondary: 0 }

    for (const school of schools) {
      const decay = distanceDecay(walkingMeters(centroid, school), SCHOOL_FULL_M, SCHOOL_ZERO_M)
      if (decay <= 0) continue
      nearestAccess = Math.max(nearestAccess, decay)
      const level = levelFor(school.name)
      if (level) bestByLevel[level] = Math.max(bestByLevel[level], decay)
    }

    // Split between "is there a school nearby at all" and "are the levels
    // actually covered". Previously an unnamed school was credited to all three
    // levels, which handed a perfect 100 to any area with one school of unknown
    // type — OSM rarely tags `isced:level`, so that was inventing coverage.
    // Unlabelled schools now count only toward proximity.
    const levelsCovered = SCHOOL_LEVELS.filter((l) => bestByLevel[l] > 0).length
    const coverage = levelsCovered / SCHOOL_LEVELS.length
    return clamp0to100((PROXIMITY_SHARE * nearestAccess + COVERAGE_SHARE * coverage) * 100)
  }

  private amenitiesScore(pois: ScorablePoi[], centroid: LatLng): number {
    const decayedByCategory: Record<string, number> = {}
    for (const poi of pois) {
      const category = poi.category as PoiCategory
      if (!POI_CATEGORIES.includes(category)) continue
      const decay = distanceDecay(walkingMeters(centroid, poi), AMENITY_FULL_M, AMENITY_ZERO_M)
      decayedByCategory[category] = (decayedByCategory[category] ?? 0) + decay
    }

    // Cap each category's contribution to reward variety over raw count.
    let total = 0
    for (const category of POI_CATEGORIES) {
      total += Math.min(decayedByCategory[category] ?? 0, PER_CATEGORY_CAP)
    }
    return clamp0to100((total / AMENITY_ANCHOR) * 100)
  }
}

// v1 level inference from the POI name. Returns null when the name doesn't
// identify a level — the caller counts those toward proximity only, never
// toward level coverage.
function levelFor(name?: string | null): SchoolLevel | null {
  const n = (name ?? '').toLowerCase()
  if (/element|primary|élémentaire/.test(n)) return 'elementary'
  if (/middle|junior|intermediate/.test(n)) return 'middle'
  if (/second|high school|senior|collegiate/.test(n)) return 'secondary'
  return null
}

function clamp0to100(n: number): number {
  return Math.max(0, Math.min(100, n))
}

function round1(n: number): number {
  return Math.round(n * 10) / 10
}
