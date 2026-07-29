import { Body, Controller, Get, NotFoundException, Param, Post, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { ClerkAuthGuard } from '../../common/guards/clerk-auth.guard'
import { CurrentUser } from '../../common/decorators/current-user.decorator'
import { VibeCheckService, PublicQuizQuestion, VibeCheckSubmitResponse } from './vibe-check.service'
import { SubmitVibeCheckDto } from './dto/submit-vibe-check.dto'
import { ClaimVibeCheckDto } from './dto/claim-vibe-check.dto'

// VIBE-CHECK — anonymous-first by design (PRD §8): no auth guard on the quiz
// routes below. `userId` on the persisted result stays null until `claim`
// (the post-signup merge step, guarded — it needs to know who's calling) is
// hit from the result page.
@ApiTags('vibe-check')
@Controller('vibe-check')
export class VibeCheckController {
  constructor(private readonly vibeCheck: VibeCheckService) {}

  @Get('questions')
  @ApiOperation({ summary: 'The Neighbourhood Vibe Check quiz bank (ids/text only, no scoring deltas)' })
  getQuestions(): PublicQuizQuestion[] {
    return this.vibeCheck.getQuestions()
  }

  @Post('submit')
  @ApiOperation({ summary: 'Score quiz answers, match a neighbourhood, and persist the shareable result' })
  submit(@Body() dto: SubmitVibeCheckDto): Promise<VibeCheckSubmitResponse> {
    return this.vibeCheck.submit(dto)
  }

  @Get('result/:shortId')
  @ApiOperation({ summary: 'Fetch a previously-submitted result by its public shortId' })
  async getResult(@Param('shortId') shortId: string): Promise<VibeCheckSubmitResponse> {
    const result = await this.vibeCheck.getResultByShortId(shortId)
    if (!result) throw new NotFoundException(`No vibe check result for shortId "${shortId}"`)
    return result
  }

  @Post('claim')
  @UseGuards(ClerkAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      "Attach an anonymous quiz session's unclaimed results to the signed-in user, pre-filling onboarding's lifestylePriorities if unset. Idempotent.",
  })
  claim(@CurrentUser() clerkId: string, @Body() dto: ClaimVibeCheckDto): Promise<{ claimed: number }> {
    return this.vibeCheck.claim(clerkId, dto)
  }
}
