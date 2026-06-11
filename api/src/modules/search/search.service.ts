import { Injectable, Logger } from '@nestjs/common'
import { createHash } from 'crypto'
import { RedisService } from '../../common/redis/redis.service'
import { DdfQueryService, MapPin, SearchResult } from '../ddf-sync/ddf-query.service'
import { SearchQueryDto } from './dto/search-query.dto'

/** 5 minutes — on-demand DDF results are fresh enough at this TTL */
const SEARCH_TTL = 300
const MAP_PINS_TTL = 300

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name)

  constructor(
    private ddfQuery: DdfQueryService,
    private redis: RedisService,
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

  async getMapPins(bbox: string): Promise<MapPin[]> {
    const cacheKey = `map-pins:${this.hashQuery({ bbox })}`
    const cached = await this.redis.get(cacheKey)
    if (cached) return JSON.parse(cached) as MapPin[]

    const pins = await this.ddfQuery.getMapPins(bbox)

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

  private hashQuery(obj: Record<string, unknown>): string {
    return createHash('md5').update(JSON.stringify(obj)).digest('hex')
  }
}
