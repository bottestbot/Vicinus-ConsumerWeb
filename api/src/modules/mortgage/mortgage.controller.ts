import { Body, Controller, HttpCode, Post } from '@nestjs/common'
import { Throttle } from '@nestjs/throttler'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { MortgageService } from './mortgage.service'
import { CreateMortgageLeadDto } from './dto/create-mortgage-lead.dto'

@ApiTags('mortgage')
@Controller('mortgage')
export class MortgageController {
  constructor(private readonly mortgage: MortgageService) {}

  /**
   * POST /mortgage/inquiry — the Mortgage Analysis widget's "Contact Mortgage
   * Broker" form. Unauthenticated: anonymous buyers must be able to reach the
   * team. Throttled because it fans out to Airtable under our account.
   */
  @Post('inquiry')
  @HttpCode(200)
  @Throttle({ default: { ttl: 60_000, limit: 8 } })
  @ApiOperation({ summary: 'Submit a "Contact Mortgage Broker" inquiry' })
  submitInquiry(@Body() dto: CreateMortgageLeadDto): Promise<{ ok: boolean }> {
    return this.mortgage.submitInquiry(dto)
  }
}
