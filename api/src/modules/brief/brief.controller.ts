import { Controller, Get, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { ClerkAuthGuard } from '../../common/guards/clerk-auth.guard'
import { CurrentUser } from '../../common/decorators/current-user.decorator'
import { BriefService } from './brief.service'

@ApiTags('brief')
@Controller('users/me/brief')
@UseGuards(ClerkAuthGuard)
@ApiBearerAuth()
export class BriefController {
  constructor(private readonly brief: BriefService) {}

  @Get()
  @ApiOperation({ summary: 'Vicinus IQ Brief — AI-phrased prose over real alert + preference data (trailing 7 days)' })
  getBrief(@CurrentUser() clerkId: string) {
    return this.brief.getBrief(clerkId)
  }
}
