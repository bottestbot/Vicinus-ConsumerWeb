import { Controller, Get, Param } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'

@ApiTags('agents')
@Controller('agents')
export class AgentsController {
  @Get(':id') detail(@Param('id') id: string) { return { id } }
  @Get(':id/listings') listings(@Param('id') id: string) { return [] }
}
