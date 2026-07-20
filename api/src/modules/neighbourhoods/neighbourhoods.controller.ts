import { Controller, Get, Param, UseGuards } from '@nestjs/common'
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger'
import {
  NeighbourhoodsService,
  AgentSummary,
  EssentialSummary,
  ListingSummary,
  NeighbourhoodDetail,
  NeighbourhoodSummary,
} from './neighbourhoods.service'
import { OptionalClerkAuthGuard } from '../../common/guards/optional-clerk-auth.guard'
import { CurrentUser } from '../../common/decorators/current-user.decorator'

@ApiTags('neighbourhoods')
@Controller('neighbourhoods')
export class NeighbourhoodsController {
  constructor(private readonly service: NeighbourhoodsService) {}

  // NBHD-09 — optional auth: anonymous callers get everything except the
  // personalized match block; signed-in callers also get `personalization`.
  @Get(':slug/detail')
  @UseGuards(OptionalClerkAuthGuard)
  @ApiOperation({ summary: 'Aggregate neighbourhood detail (market, livability, essentials, listings)' })
  @ApiParam({ name: 'slug', description: 'Neighbourhood slug' })
  getDetail(
    @Param('slug') slug: string,
    @CurrentUser() clerkId?: string,
  ): Promise<NeighbourhoodDetail> {
    return this.service.getDetail(slug, clerkId)
  }

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
