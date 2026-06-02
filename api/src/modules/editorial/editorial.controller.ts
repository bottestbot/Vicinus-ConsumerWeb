import { Controller, Get } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { EditorialService } from './editorial.service'

@ApiTags('editorial')
@Controller('editorial')
export class EditorialController {
  constructor(private editorial: EditorialService) {}

  @Get()
  @ApiOperation({ summary: 'Return all editorial curations ordered by position' })
  findAll() {
    return this.editorial.findAll()
  }
}
