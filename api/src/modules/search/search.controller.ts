import { Controller, Get, NotFoundException, Param, Query } from '@nestjs/common'
import { ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger'
import { SearchService } from './search.service'
import { SearchQueryDto } from './dto/search-query.dto'

@ApiTags('search')
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  @ApiOperation({ summary: 'Search properties via DDF API passthrough (city, price, beds, baths, bbox, …)' })
  search(@Query() query: SearchQueryDto) {
    return this.searchService.search(query)
  }

  @Get('map-pins')
  @ApiOperation({ summary: 'Lightweight geo + price pins for the map viewport' })
  @ApiQuery({ name: 'bbox', required: true, example: '-79.63,43.58,-79.27,43.85', description: 'west,south,east,north' })
  mapPins(@Query('bbox') bbox: string) {
    return this.searchService.getMapPins(bbox ?? '')
  }

  @Get('listing/:key')
  @ApiOperation({ summary: 'Full detail for a single live DDF listing by ListingKey' })
  @ApiParam({ name: 'key', description: 'DDF ListingKey (matches the id returned by search)' })
  async listing(@Param('key') key: string) {
    const listing = await this.searchService.getListing(key)
    if (!listing) throw new NotFoundException(`Listing ${key} not found`)
    return listing
  }
}
