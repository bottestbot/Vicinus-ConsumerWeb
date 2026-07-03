import { Body, Controller, Post } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { WaitlistService } from './waitlist.service'
import { JoinWaitlistDto } from './dto/join-waitlist.dto'

@ApiTags('waitlist')
@Controller('waitlist')
export class WaitlistController {
  constructor(private readonly waitlist: WaitlistService) {}

  // POST /waitlist/realtor
  // Captures a Realtor Hub early-access signup. Idempotent on email.
  @Post('realtor')
  @ApiOperation({ summary: 'Join the Realtor Hub early-access waitlist' })
  joinRealtor(@Body() dto: JoinWaitlistDto) {
    return this.waitlist.joinRealtor(dto)
  }
}
