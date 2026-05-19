import { Controller, Get, Param } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'

@ApiTags('properties')
@Controller('properties')
export class PropertiesController {
  @Get() list() { return [] }
  @Get(':id') detail(@Param('id') id: string) { return { id } }
  @Get(':id/nearby-open-houses') nearbyOpenHouses(@Param('id') id: string) { return [] }
  @Get(':id/market-context') marketContext(@Param('id') id: string) { return {} }
  @Get(':id/similar') similar(@Param('id') id: string) { return [] }
}
