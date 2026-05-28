import { Controller, Get, Query } from '@nestjs/common'
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger'
import { SearchService } from './search.service'
import { SearchQueryDto } from './dto/search-query.dto'

@ApiTags('search')
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  /**
   * BE-301: Full property search with all filter params.
   * When `bbox` is present the query is routed through the PostGIS spatial
   * index (BE-302).  Results are cached in Redis for 2 minutes (BE-305).
   */
  @Get()
  @ApiOperation({ summary: 'Search properties with filters (+ optional PostGIS bbox)' })
  search(@Query() query: SearchQueryDto) {
    return this.searchService.search(query)
  }

  /**
   * BE-304: Lightweight geo + price endpoint for the map view.
   * Returns only id / lat / lng / price — no heavy joins.
   * Cached in Redis for 5 minutes.
   */
  @Get('map-pins')
  @ApiOperation({ summary: 'Lightweight geo + price pins for the map viewport' })
  @ApiQuery({ name: 'bbox', required: true, example: '-79.63,43.58,-79.27,43.85', description: 'west,south,east,north' })
  mapPins(@Query('bbox') bbox: string) {
    return this.searchService.getMapPins(bbox ?? '')
  }
}
