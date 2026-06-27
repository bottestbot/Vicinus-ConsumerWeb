import { Body, Controller, Post } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { SellService } from './sell.service'
import { SellValuationDto } from './dto/sell-valuation.dto'

@ApiTags('sell')
@Controller('sell')
export class SellController {
  constructor(private readonly sell: SellService) {}

  // POST /sell/valuation
  // Captures the seller lead and returns a Gemini-generated valuation for the address.
  @Post('valuation')
  @ApiOperation({ summary: 'Capture a seller lead and generate an AI home valuation' })
  createValuation(@Body() dto: SellValuationDto) {
    return this.sell.createValuation(dto)
  }
}
