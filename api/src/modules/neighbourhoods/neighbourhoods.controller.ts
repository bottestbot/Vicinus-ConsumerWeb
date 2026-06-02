import { Controller, Get, Param } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { NeighbourhoodsService } from './neighbourhoods.service'

@ApiTags('neighbourhoods')
@Controller('neighbourhoods')
export class NeighbourhoodsController {
  constructor(private readonly service: NeighbourhoodsService) {}

  @Get()
  list() {
    return this.service.listAll()
  }

  @Get(':slug')
  detail(@Param('slug') slug: string) {
    return this.service.findBySlug(slug)
  }

  @Get(':slug/listings')
  listings(@Param('slug') slug: string) {
    return this.service.getListings(slug)
  }

  @Get(':slug/essentials')
  essentials(@Param('slug') slug: string) {
    return this.service.getEssentials(slug)
  }

  @Get(':slug/agents')
  agents(@Param('slug') slug: string) {
    return this.service.getAgents(slug)
  }
}
