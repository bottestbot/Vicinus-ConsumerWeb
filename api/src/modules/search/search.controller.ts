import { Controller, Get, Query } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'

@ApiTags('search')
@Controller('search')
export class SearchController {
  @Get() search(@Query() query: Record<string, string>) { return { results: [], total: 0 } }
  @Get('map-pins') mapPins(@Query('bbox') bbox: string) { return [] }
}
