import { Body, Controller, Post } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { SellService } from './sell.service'
import { SellValuationDto } from './dto/sell-valuation.dto'
import { SellPreviewDto } from './dto/sell-preview.dto'

@ApiTags('sell')
@Controller('sell')
export class SellController {
  constructor(private readonly sell: SellService) {}

  // POST /sell/preview
  // Returns a real, model-derived estimate range for the address WITHOUT
  // persisting a lead or requiring contact details. Powers the teaser shown
  // above the lead-capture form; the precise valuation stays behind /sell/valuation.
  @Post('preview')
  @ApiOperation({ summary: 'Get a lead-free preliminary estimate range for an address' })
  previewEstimate(@Body() dto: SellPreviewDto) {
    return this.sell.previewEstimate(dto)
  }

  // POST /sell/valuation
  // Captures the seller lead and returns a Gemini-generated valuation for the address.
  @Post('valuation')
  @ApiOperation({ summary: 'Capture a seller lead and generate an AI home valuation' })
  createValuation(@Body() dto: SellValuationDto) {
    return this.sell.createValuation(dto)
  }
}
