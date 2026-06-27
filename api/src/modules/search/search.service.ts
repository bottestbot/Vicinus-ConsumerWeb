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
   * City + neighbourhood autocomplete. Cities come from the static CANADIAN_CITIES
   * list (DDF has no city directory endpoint); neighbourhoods come from the seeded
   * Neighbourhood table. Prefix matches rank above substring matches, cities above
   * neighbourhoods. Short-Redis-cached per query.
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

    // Cities: prefix or substring match, prefix-first.
    const cities = CANADIAN_CITIES.filter((c) =>
      c.label.toLowerCase().includes(lower),
    ).sort(
      (a, b) =>
        (a.label.toLowerCase().startsWith(lower) ? 0 : 1) -
        (b.label.toLowerCase().startsWith(lower) ? 0 : 1),
    )

    // Neighbourhoods: case-insensitive contains on the seeded table.
    const hoods = await this.prisma.neighbourhood.findMany({
      where: { name: { contains: query, mode: 'insensitive' } },
      select: { slug: true, name: true, city: true, province: true },
      take: 6,
      orderBy: { name: 'asc' },
    })
    // Drop neighbourhood rows that duplicate a city already shown (the seeded
    // municipality rows like "North Vancouver" overlap with the city list), and
    // collapse same-name neighbourhood duplicates (e.g. a stray seed row).
    const cityLabels = new Set(cities.map((c) => c.label.toLowerCase()))
    const seenHoods = new Set<string>()
    const hoodSuggestions = hoods
      .filter((n) => {
        const key = n.name.toLowerCase()
        if (cityLabels.has(key) || seenHoods.has(key)) return false
        seenHoods.add(key)
        return true
      })
      .map((n) => ({
        id: `n-${n.slug}`,
        label: n.name,
        type: 'neighbourhood',
        subtitle: [n.city, n.province].filter(Boolean).join(', '),
      }))

    const results = [...cities.slice(0, 6), ...hoodSuggestions].slice(0, 10)
    await this.redis.set(cacheKey, JSON.stringify(results), SEARCH_TTL)
    return results
  }

  private hashQuery(obj: Record<string, unknown>): string {
    return createHash('md5').update(JSON.stringify(obj)).digest('hex')
  }
}
