import { Body, Controller, HttpCode, Post } from '@nestjs/common'
import { Throttle } from '@nestjs/throttler'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { LeadService } from './lead.service'
import { CreateLeadDto } from './dto/create-lead.dto'

@ApiTags('lead')
@Controller('lead')
export class LeadController {
  constructor(private readonly lead: LeadService) {}

  /**
   * POST /lead/inquiry — a buyer's "Email REALTOR®" inquiry from a listing's
   * Send Message form. Unauthenticated: anonymous buyers must be able to
   * contact the listing agent. Tightly throttled because it fans out to
   * Airtable (and, once enabled, to CREA's Lead API) under our account.
   */
  @Post('inquiry')
  @HttpCode(200)
  @Throttle({ default: { ttl: 60_000, limit: 8 } })
  @ApiOperation({ summary: "Submit a buyer's inquiry to the listing REALTOR®" })
  submitInquiry(@Body() dto: CreateLeadDto): Promise<{ ok: boolean }> {
    return this.lead.submitInquiry(dto)
  }
}
