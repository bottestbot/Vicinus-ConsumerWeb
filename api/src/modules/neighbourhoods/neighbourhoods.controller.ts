import { Controller, Get, NotFoundException, Param, Res, UseGuards } from '@nestjs/common'
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger'
import type { Response } from 'express'
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

  // NBHD-08 — per-user match block, fetched client-side once Clerk has a
  // session. It cannot ride on /detail: that response is server-rendered and
  // shared-cached, so no token reaches it and a per-user payload there would be
  // served to every visitor. Returns null when the caller is anonymous.
  @Get(':slug/personalization')
  @UseGuards(OptionalClerkAuthGuard)
  @ApiOperation({ summary: 'Per-user personalization match block for a neighbourhood' })
  @ApiParam({ name: 'slug', description: 'Neighbourhood slug' })
  personalization(@Param('slug') slug: string, @CurrentUser() clerkId?: string) {
    return this.service.getPersonalization(slug, clerkId)
  }

  // NBHD-03 — streams the Google tile image from the server so the API key is
  // never exposed to the client. Cached hard: the underlying image only changes
  // if the neighbourhood centroid moves.
  @Get(':slug/tile/:kind')
  @ApiOperation({ summary: 'Proxied Static Map / Street View image for a neighbourhood' })
  @ApiParam({ name: 'slug', description: 'Neighbourhood slug' })
  @ApiParam({ name: 'kind', enum: ['map', 'street-view'] })
  async tile(
    @Param('slug') slug: string,
    @Param('kind') kind: string,
    @Res() res: Response,
  ): Promise<void> {
    if (kind !== 'map' && kind !== 'street-view') {
      throw new NotFoundException(`Unknown tile kind "${kind}"`)
    }
    const image = await this.service.getTileImage(slug, kind)
    if (!image) {
      // No API key or no centroid — let the FE fall back to its own placeholder.
      throw new NotFoundException('Tile image unavailable')
    }
    res.setHeader('Content-Type', image.contentType)
    res.setHeader('Cache-Control', 'public, max-age=86400')
    res.send(image.data)
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
