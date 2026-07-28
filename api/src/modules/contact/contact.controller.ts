import { Body, Controller, HttpCode, Post } from '@nestjs/common'
import { Throttle } from '@nestjs/throttler'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { ContactService } from './contact.service'
import { ContactDto } from './dto/contact.dto'

@ApiTags('contact')
@Controller('contact')
export class ContactController {
  constructor(private readonly contact: ContactService) {}

  /**
   * POST /contact — the homepage "Get in Touch" form. Unauthenticated:
   * anonymous visitors must be able to reach the Vicinus team. Throttled
   * because it fans out to Airtable under our account.
   */
  @Post()
  @HttpCode(200)
  @Throttle({ default: { ttl: 60_000, limit: 8 } })
  @ApiOperation({ summary: 'Submit the homepage "Get in Touch" message to Vicinus' })
  submitContact(@Body() dto: ContactDto): Promise<{ ok: boolean }> {
    return this.contact.submitContact(dto)
  }
}
