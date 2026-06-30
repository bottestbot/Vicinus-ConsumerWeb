import { Injectable, Logger } from '@nestjs/common'
import { createHash } from 'crypto'
import { RedisService } from '../../common/redis/redis.service'
import { PrismaService } from '../../prisma/prisma.service'
import {
  DdfQueryService,
  MapPin,
  NearbyOpenHouse,
  OpenHouseSlot,
  SearchResult,
} from '../ddf-sync/ddf-query.service'
import { SearchQueryDto } from './dto/search-query.dto'

const CANADIAN_CITIES = [
  { id: 'c-vancouver', label: 'Vancouver', type: 'city', subtitle: 'British Columbia' },
  { id: 'c-victoria', label: 'Victoria', type: 'city', subtitle: 'British Columbia' },
  { id: 'c-vaughan', label: 'Vaughan', type: 'city', subtitle: 'Ontario' },
  { id: 'c-vernon', label: 'Vernon', type: 'city', subtitle: 'British Columbia' },
  { id: 'c-victoriaville', label: 'Victoriaville', type: 'city', subtitle: 'Quebec' },
  { id: 'c-vaudreuil', label: 'Vaudreuil-Dorion', type: 'city', subtitle: 'Quebec' },
  { id: 'c-toronto', label: 'Toronto', type: 'city', subtitle: 'Ontario' },
  { id: 'c-mississauga', label: 'Mississauga', type: 'city', subtitle: 'Ontario' },
  { id: 'c-brampton', label: 'Brampton', type: 'city', subtitle: 'Ontario' },
  { id: 'c-hamilton', label: 'Hamilton', type: 'city', subtitle: 'Ontario' },
  { id: 'c-london-on', label: 'London', type: 'city', subtitle: 'Ontario' },
  { id: 'c-markham', label: 'Markham', type: 'city', subtitle: 'Ontario' },
  { id: 'c-richmond-hill', label: 'Richmond Hill', type: 'city', subtitle: 'Ontario' },
  { id: 'c-oakville', label: 'Oakville', type: 'city', subtitle: 'Ontario' },
  { id: 'c-burlington', label: 'Burlington', type: 'city', subtitle: 'Ontario' },
  { id: 'c-kitchener', label: 'Kitchener', type: 'city', subtitle: 'Ontario' },
  { id: 'c-waterloo', label: 'Waterloo', type: 'city', subtitle: 'Ontario' },
  { id: 'c-guelph', label: 'Guelph', type: 'city', subtitle: 'Ontario' },
  { id: 'c-ottawa', label: 'Ottawa', type: 'city', subtitle: 'Ontario' },
  { id: 'c-oshawa', label: 'Oshawa', type: 'city', subtitle: 'Ontario' },
  { id: 'c-barrie', label: 'Barrie', type: 'city', subtitle: 'Ontario' },
  { id: 'c-kingston', label: 'Kingston', type: 'city', subtitle: 'Ontario' },
  { id: 'c-windsor', label: 'Windsor', type: 'city', subtitle: 'Ontario' },
  { id: 'c-burnaby', label: 'Burnaby', type: 'city', subtitle: 'British Columbia' },
  { id: 'c-surrey', label: 'Surrey', type: 'city', subtitle: 'British Columbia' },
  { id: 'c-richmond-bc', label: 'Richmond', type: 'city', subtitle: 'British Columbia' },
  { id: 'c-kelowna', label: 'Kelowna', type: 'city', subtitle: 'British Columbia' },
  { id: 'c-abbotsford', label: 'Abbotsford', type: 'city', subtitle: 'British Columbia' },
  { id: 'c-coquitlam', label: 'Coquitlam', type: 'city', subtitle: 'British Columbia' },
  { id: 'c-langley', label: 'Langley', type: 'city', subtitle: 'British Columbia' },
  { id: 'c-north-van', label: 'North Vancouver', type: 'city', subtitle: 'British Columbia' },
  { id: 'c-west-van', label: 'West Vancouver', type: 'city', subtitle: 'British Columbia' },
  { id: 'c-nanaimo', label: 'Nanaimo', type: 'city', subtitle: 'British Columbia' },
  { id: 'c-kamloops', label: 'Kamloops', type: 'city', subtitle: 'British Columbia' },
  { id: 'c-chilliwack', label: 'Chilliwack', type: 'city', subtitle: 'British Columbia' },
  { id: 'c-calgary', label: 'Calgary', type: 'city', subtitle: 'Alberta' },
  { id: 'c-edmonton', label: 'Edmonton', type: 'city', subtitle: 'Alberta' },
  { id: 'c-red-deer', label: 'Red Deer', type: 'city', subtitle: 'Alberta' },
  { id: 'c-lethbridge', label: 'Lethbridge', type: 'city', subtitle: 'Alberta' },
  { id: 'c-airdrie', label: 'Airdrie', type: 'city', subtitle: 'Alberta' },
  { id: 'c-montreal', label: 'Montreal', type: 'city', subtitle: 'Quebec' },
  { id: 'c-quebec-city', label: 'Quebec City', type: 'city', subtitle: 'Quebec' },
  { id: 'c-laval', label: 'Laval', type: 'city', subtitle: 'Quebec' },
  { id: 'c-gatineau', label: 'Gatineau', type: 'city', subtitle: 'Quebec' },
  { id: 'c-sherbrooke', label: 'Sherbrooke', type: 'city', subtitle: 'Quebec' },
  { id: 'c-winnipeg', label: 'Winnipeg', type: 'city', subtitle: 'Manitoba' },
  { id: 'c-saskatoon', label: 'Saskatoon', type: 'city', subtitle: 'Saskatchewan' },
  { id: 'c-regina', label: 'Regina', type: 'city', subtitle: 'Saskatchewan' },
  { id: 'c-halifax', label: 'Halifax', type: 'city', subtitle: 'Nova Scotia' },
  { id: 'c-moncton', label: 'Moncton', type: 'city', subtitle: 'New Brunswick' },
  { id: 'c-fredericton', label: 'Fredericton', type: 'city', subtitle: 'New Brunswick' },
  { id: 'c-charlottetown', label: 'Charlottetown', type: 'city', subtitle: 'Prince Edward Island' },
  { id: 'c-stjohns', label: "St. John's", type: 'city', subtitle: 'Newfoundland' },
]

/** Province code → full name, for rendering city subtitles consistently
 * (DB stores codes like "BC"; the static fallback list uses full names). */
const PROVINCE_NAMES: Record<string, string> = {
  AB: 'Alberta',
  BC: 'British Columbia',
  MB: 'Manitoba',
  NB: 'New Brunswick',
  NL: 'Newfoundland and Labrador',
  NS: 'Nova Scotia',
  NT: 'Northwest Territories',
  NU: 'Nunavut',
  ON: 'Ontario',
  PE: 'Prince Edward Island',
  QC: 'Quebec',
  SK: 'Saskatchewan',
  YT: 'Yukon',
}

const provinceLabel = (code?: string | null): string =>
  code ? (PROVINCE_NAMES[code] ?? code) : ''

/** 5 minutes — on-demand DDF results are fresh enough at this TTL */
const SEARCH_TTL = 300
const MAP_PINS_TTL = 300

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name)

  constructor(
    private ddfQuery: DdfQueryService,
    private redis: RedisService,
    private prisma: PrismaService,
  ) {}

  async search(dto: SearchQueryDto): Promise<SearchResult> {
    const cacheKey = `search:${this.hashQuery(dto as Record<string, unknown>)}`
    const cached = await this.redis.get(cacheKey)
    if (cached) return JSON.parse(cached) as SearchResult

    const page = dto.page ?? 1
    const limit = Math.min(dto.limit ?? 20, 100)
    const skip = (page - 1) * limit

    const result = await this.ddfQuery.searchProperties(dto, skip, limit)

    await this.redis.set(cacheKey, JSON.stringify(result), SEARCH_TTL)
    return result
  }

  async getMapPins(dto: SearchQueryDto): Promise<MapPin[]> {
    const cacheKey = `map-pins:${this.hashQuery(dto as Record<string, unknown>)}`
    const cached = await this.redis.get(cacheKey)
    if (cached) return JSON.parse(cached) as MapPin[]

    const pins = await this.ddfQuery.getMapPins(dto)

    await this.redis.set(cacheKey, JSON.stringify(pins), MAP_PINS_TTL)
    return pins
  }

  async getListing(listingKey: string): Promise<Record<string, unknown> | null> {
    const cacheKey = `listing:${listingKey}`
    const cached = await this.redis.get(cacheKey)
    if (cached) return JSON.parse(cached) as Record<string, unknown>

    const listing = await this.ddfQuery.getListingByKey(listingKey)
    if (listing) {
      await this.redis.set(cacheKey, JSON.stringify(listing), SEARCH_TTL)
    }
    return listing
  }

  async getListingOpenHouses(listingKey: string): Promise<OpenHouseSlot[]> {
    const cacheKey = `listing-oh:${listingKey}`
    const cached = await this.redis.get(cacheKey)
    if (cached) return JSON.parse(cached) as OpenHouseSlot[]

    const slots = await this.ddfQuery.getOpenHousesByKey(listingKey)
    await this.redis.set(cacheKey, JSON.stringify(slots), SEARCH_TTL)
    return slots
  }

  async getListingNearbyOpenHouses(listingKey: string): Promise<NearbyOpenHouse[]> {
    const cacheKey = `listing-nearby-oh:${listingKey}`
    const cached = await this.redis.get(cacheKey)
    if (cached) return JSON.parse(cached) as NearbyOpenHouse[]

    const nearby = await this.ddfQuery.getNearbyOpenHousesByKey(listingKey)
    await this.redis.set(cacheKey, JSON.stringify(nearby), SEARCH_TTL)
    return nearby
  }

  /**
   * City + neighbourhood autocomplete. The seeded Neighbourhood table is the
   * source of truth: rows where `name === city` are municipalities (rendered as
   * cities), and rows where they differ are sub-areas (rendered as
   * neighbourhoods). The static CANADIAN_CITIES list is only a fallback for
   * metros not yet seeded (e.g. outside BC), deduped so DB rows always win.
   * Prefix matches rank above substring matches, cities above neighbourhoods.
   * Short-Redis-cached per query.
   */
  async autocomplete(
    q: string,
  ): Promise<{ id: string; label: string; type: string; subtitle: string }[]> {
    const query = (q ?? '').trim()
    if (query.length < 1) return []
    const lower = query.toLowerCase()

    const cacheKey = `autocomplete:${lower}`
    const cached = await this.redis.get(cacheKey)
    if (cached) return JSON.parse(cached)

    // DB is authoritative: match on either the area name or its parent city.
    const hoods = await this.prisma.neighbourhood.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { city: { contains: query, mode: 'insensitive' } },
        ],
      },
      select: { slug: true, name: true, city: true, province: true },
      take: 24,
      orderBy: { name: 'asc' },
    })

    // Partition into municipalities (name === city) and sub-areas, collapsing
    // duplicate city rows (e.g. several Vancouver neighbourhoods share a city).
    const dbCities: { id: string; label: string; type: string; subtitle: string }[] = []
    const neighbourhoods: { id: string; label: string; type: string; subtitle: string }[] = []
    const seenCity = new Set<string>()
    const seenHood = new Set<string>()

    for (const n of hoods) {
      const isCity = !!n.city && n.name === n.city
      const key = n.name.toLowerCase()
      if (isCity) {
        if (seenCity.has(key)) continue
        seenCity.add(key)
        dbCities.push({
          id: `c-${n.slug}`,
          label: n.name,
          type: 'city',
          subtitle: provinceLabel(n.province),
        })
      } else {
        if (seenHood.has(key)) continue
        seenHood.add(key)
        neighbourhoods.push({
          id: `n-${n.slug}`,
          label: n.name,
          type: 'neighbourhood',
          subtitle: [n.city, provinceLabel(n.province)].filter(Boolean).join(', '),
        })
      }
    }

    // Fallback cities (not already covered by the DB), e.g. metros outside BC.
    const fallbackCities = CANADIAN_CITIES.filter(
      (c) =>
        c.label.toLowerCase().includes(lower) &&
        !seenCity.has(c.label.toLowerCase()),
    )

    // Rank cities prefix-first, then sub-area neighbourhoods.
    const prefixFirst = (
      a: { label: string },
      b: { label: string },
    ): number =>
      (a.label.toLowerCase().startsWith(lower) ? 0 : 1) -
      (b.label.toLowerCase().startsWith(lower) ? 0 : 1)

    const cities = [...dbCities, ...fallbackCities].sort(prefixFirst)
    neighbourhoods.sort(prefixFirst)

    const results = [...cities.slice(0, 6), ...neighbourhoods].slice(0, 10)
    await this.redis.set(cacheKey, JSON.stringify(results), SEARCH_TTL)
    return results
  }

  private hashQuery(obj: Record<string, unknown>): string {
    return createHash('md5').update(JSON.stringify(obj)).digest('hex')
  }
}
