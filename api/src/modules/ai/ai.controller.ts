import { Controller, Delete, Get, Param, Post } from '@nestjs/common'
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger'
import { AiService } from './ai.service'

@ApiTags('ai')
@Controller('ai')
export class AiController {
  constructor(private readonly ai: AiService) {}

  // GET /ai/property-summary/:id
  // Returns cached summary if available, otherwise generates and caches.
  @Get('property-summary/:id')
  @ApiOperation({ summary: 'AI property intelligence summary (property, investment, lifestyle)' })
  @ApiParam({ name: 'id', description: 'Property UUID' })
  getSummary(@Param('id') id: string) {
    return this.ai.getPropertySummary(id)
  }

  // POST /ai/property-summary/:id/regenerate
  // Busts the cache and generates a fresh summary (backs the "Regenerate" button).
  @Post('property-summary/:id/regenerate')
  @ApiOperation({ summary: 'Bust cache and regenerate AI summary for a property' })
  @ApiParam({ name: 'id', description: 'Property UUID' })
  regenerate(@Param('id') id: string) {
    return this.ai.regeneratePropertySummary(id)
  }

  // GET /ai/neighbourhood-summary/:slug
  @Get('neighbourhood-summary/:slug')
  @ApiOperation({ summary: 'AI neighbourhood summary (safety, lifestyle, schools, growth)' })
  @ApiParam({ name: 'slug', description: 'Neighbourhood slug' })
  getNeighbourhoodSummary(@Param('slug') slug: string) {
    return this.ai.getNeighbourhoodSummary(slug)
  }
}
