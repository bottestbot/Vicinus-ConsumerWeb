import { Controller, Get, Param } from '@nestjs/common'
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger'
import { PropertiesService } from './properties.service'

@ApiTags('properties')
@Controller('properties')
export class PropertiesController {
  constructor(private readonly properties: PropertiesService) {}

  // ── BE-H ────────────────────────────────────────────────────────────────
  // Static route declared before ':id' so "featured" isn't captured as an id.
  @Get('featured')
  @ApiOperation({ summary: 'Curated highlight listings for the landing page (curator picks, else top active)' })
  featured() {
    return this.properties.getFeatured()
  }

  // ── BE-401 ──────────────────────────────────────────────────────────────
  @Get(':id')
  @ApiOperation({ summary: 'Full property detail (agent, office, neighbourhood, open houses)' })
  @ApiParam({ name: 'id', description: 'Property UUID' })
  detail(@Param('id') id: string) {
    return this.properties.findById(id)
  }

  // ── BE-402 ──────────────────────────────────────────────────────────────
  @Get(':id/nearby-open-houses')
  @ApiOperation({ summary: 'Upcoming open houses for this listing and nearby properties' })
  @ApiParam({ name: 'id', description: 'Property UUID' })
  nearbyOpenHouses(@Param('id') id: string) {
    return this.properties.getNearbyOpenHouses(id)
  }

  // ── BE-403 ──────────────────────────────────────────────────────────────
  @Get(':id/market-context')
  @ApiOperation({ summary: 'Days on market, price position, demand level, city comparables' })
  @ApiParam({ name: 'id', description: 'Property UUID' })
  marketContext(@Param('id') id: string) {
    return this.properties.getMarketContext(id)
  }

  // ── BE-404 ──────────────────────────────────────────────────────────────
  @Get(':id/assessment-history')
  @ApiOperation({ summary: 'Tax / assessment history from CREA DDF (current year)' })
  @ApiParam({ name: 'id', description: 'Property UUID' })
  assessmentHistory(@Param('id') id: string) {
    return this.properties.getAssessmentHistory(id)
  }

  // ── BE-405 ──────────────────────────────────────────────────────────────
  @Get(':id/sales-history')
  @ApiOperation({ summary: 'Nearby sold comparables (DDF does not expose full transaction history)' })
  @ApiParam({ name: 'id', description: 'Property UUID' })
  salesHistory(@Param('id') id: string) {
    return this.properties.getSalesHistory(id)
  }

  // ── BE-406 ──────────────────────────────────────────────────────────────
  @Get(':id/similar')
  @ApiOperation({ summary: 'Similar active listings in same city / type / price band' })
  @ApiParam({ name: 'id', description: 'Property UUID' })
  similar(@Param('id') id: string) {
    return this.properties.getSimilar(id)
  }
}
