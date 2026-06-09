import { Controller, Get, Param } from '@nestjs/common'
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger'
import { NeighbourhoodsService, AgentSummary, EssentialSummary, ListingSummary, NeighbourhoodSummary } from './neighbourhoods.service'

@ApiTags('neighbourhoods')
@Controller('neighbourhoods')
export class NeighbourhoodsController {
  constructor(private readonly service: NeighbourhoodsService) {}

  @Get()
  @ApiOperation({ summary: 'List all curated neighbourhoods' })
  list(): Promise<NeighbourhoodSummary[]> {
    return this.service.listAll()
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get neighbourhood detail by slug' })
  @ApiParam({ name: 'slug', description: 'Neighbourhood slug (e.g. rosedale-toronto)' })
  detail(@Param('slug') slug: string): Promise<NeighbourhoodSummary> {
    return this.service.findBySlug(slug)
  }

  @Get(':slug/listings')
  @ApiOperation({ summary: 'Active MLS listings within the neighbourhood' })
  @ApiParam({ name: 'slug', description: 'Neighbourhood slug' })
  listings(@Param('slug') slug: string): Promise<ListingSummary[]> {
    return this.service.getListings(slug)
  }

  @Get(':slug/essentials')
  @ApiOperation({ summary: 'Local essentials (restaurants, schools, transit) near the neighbourhood' })
  @ApiParam({ name: 'slug', description: 'Neighbourhood slug' })
  essentials(@Param('slug') slug: string): Promise<EssentialSummary[]> {
    return this.service.getEssentials(slug)
  }

  @Get(':slug/agents')
  @ApiOperation({ summary: 'Area specialist agents for the neighbourhood' })
  @ApiParam({ name: 'slug', description: 'Neighbourhood slug' })
  agents(@Param('slug') slug: string): Promise<AgentSummary[]> {
    return this.service.getAgents(slug)
  }
}
