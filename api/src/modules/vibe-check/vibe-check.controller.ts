import { Body, Controller, Get, Post } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { VibeCheckService, PublicQuizQuestion, VibeCheckSubmitResponse } from './vibe-check.service'
import { SubmitVibeCheckDto } from './dto/submit-vibe-check.dto'

// VIBE-CHECK — anonymous-first by design (PRD §8): no auth guard on either
// route. `userId` on the persisted result stays null until a separate
// post-signup merge task wires it up.
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
}
