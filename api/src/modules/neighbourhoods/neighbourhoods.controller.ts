import { Controller, Get, Param } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'

@ApiTags('neighbourhoods')
@Controller('neighbourhoods')
export class NeighbourhoodsController {
  @Get() list() { return [] }
  @Get(':slug') detail(@Param('slug') slug: string) { return { slug } }
  @Get(':slug/listings') listings(@Param('slug') slug: string) { return [] }
  @Get(':slug/essentials') essentials(@Param('slug') slug: string) { return [] }
  @Get(':slug/agents') agents(@Param('slug') slug: string) { return [] }
}
