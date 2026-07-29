import { describe, it, expect } from 'vitest'
import { haversineDistanceM } from '@/lib/geo'
import { bucketShopAndEat, nearestPois, withHomeDistance } from '@/lib/poi'
import type { PoiItem } from '@/types/neighbourhood-detail'

// Surrey City Centre landmarks with well-known coordinates.
const SURREY_CENTRAL = { lat: 49.189671, lng: -122.847956 }
const KING_GEORGE = { lat: 49.182755, lng: -122.844744 }
const HOLLAND_PARK = { lat: 49.18604, lng: -122.84651 }

function poi(overrides: Partial<PoiItem>): PoiItem {
  return {
    id: 'x',
    name: 'POI',
    category: 'park',
    lat: 0,
    lng: 0,
    distanceM: 0,
    ...overrides,
  }
}

describe('haversineDistanceM', () => {
  it('is zero for identical points', () => {
    expect(haversineDistanceM(49.19, -122.85, 49.19, -122.85)).toBe(0)
  })

  it('matches the known Surrey Central → King George span (~810 m)', () => {
    const d = haversineDistanceM(
      SURREY_CENTRAL.lat,
      SURREY_CENTRAL.lng,
      KING_GEORGE.lat,
      KING_GEORGE.lng,
    )
    expect(d).toBeGreaterThan(700)
    expect(d).toBeLessThan(950)
  })

  it('handles long spans (Vancouver → Toronto ≈ 3,350 km)', () => {
    const d = haversineDistanceM(49.2827, -123.1207, 43.6532, -79.3832)
    expect(d).toBeGreaterThan(3_300_000)
    expect(d).toBeLessThan(3_400_000)
  })
})

describe('withHomeDistance', () => {
  it('computes from POI coords when both ends are valid', () => {
    const [p] = withHomeDistance(
      [poi({ lat: KING_GEORGE.lat, lng: KING_GEORGE.lng, distanceM: 12345 })],
      SURREY_CENTRAL.lat,
      SURREY_CENTRAL.lng,
    )
    expect(p.approx).toBe(false)
    expect(p.homeDistanceM).toBeGreaterThan(700)
    expect(p.homeDistanceM).toBeLessThan(950)
  })

  it('falls back to the centroid figure when POI coords are the 0,0 stand-in', () => {
    const [p] = withHomeDistance([poi({ distanceM: 420 })], SURREY_CENTRAL.lat, SURREY_CENTRAL.lng)
    expect(p.approx).toBe(true)
    expect(p.homeDistanceM).toBe(420)
  })

  it('falls back when the home has no coordinates', () => {
    const [p] = withHomeDistance(
      [poi({ lat: KING_GEORGE.lat, lng: KING_GEORGE.lng, distanceM: 999 })],
      0,
      0,
    )
    expect(p.approx).toBe(true)
    expect(p.homeDistanceM).toBe(999)
  })
})

describe('nearestPois', () => {
  const pois = [
    poi({ id: 'far', name: 'King George', lat: KING_GEORGE.lat, lng: KING_GEORGE.lng }),
    poi({ id: 'near', name: 'Holland Park', lat: HOLLAND_PARK.lat, lng: HOLLAND_PARK.lng }),
    poi({ id: 'unknown', name: 'Legacy no-distance', distanceM: 0 }),
  ]

  it('orders by distance from the home and reports the remainder', () => {
    const { nearest, moreCount } = nearestPois(pois, SURREY_CENTRAL.lat, SURREY_CENTRAL.lng, 2)
    expect(nearest.map((p) => p.id)).toEqual(['near', 'far'])
    expect(moreCount).toBe(1)
  })

  it('never lets an unknown distance win "nearest"', () => {
    const { nearest } = nearestPois(pois, SURREY_CENTRAL.lat, SURREY_CENTRAL.lng, 3)
    expect(nearest[nearest.length - 1].id).toBe('unknown')
  })

  it('handles counts larger than the pool', () => {
    const { nearest, moreCount } = nearestPois(pois, SURREY_CENTRAL.lat, SURREY_CENTRAL.lng, 10)
    expect(nearest).toHaveLength(3)
    expect(moreCount).toBe(0)
  })
})

describe('bucketShopAndEat', () => {
  it('groups categories, sorts by count and pluralises', () => {
    const buckets = bucketShopAndEat([
      { category: 'restaurant' },
      { category: 'Fast Food' },
      { category: 'fine dining' },
      { category: 'coffee shop' },
      { category: 'grocery supermarket' },
    ])
    // "coffee shop" must hit the café rule before the generic shop rule.
    expect(buckets.map((b) => `${b.count} ${b.label}`)).toEqual([
      '3 restaurants',
      '1 café',
      '1 grocer',
    ])
  })

  it('uses singular labels for count 1 and the generic bucket for unknowns', () => {
    const buckets = bucketShopAndEat([{ category: 'mystery' }])
    expect(buckets).toEqual([{ key: 'places', count: 1, label: 'place' }])
  })

  it("files the ingestion's generic 'errands' category under shops", () => {
    const buckets = bucketShopAndEat([{ category: 'errands' }, { category: 'errands' }])
    expect(buckets).toEqual([{ key: 'shops', count: 2, label: 'shops' }])
  })

  it('returns an empty list for no input', () => {
    expect(bucketShopAndEat([])).toEqual([])
  })
})
