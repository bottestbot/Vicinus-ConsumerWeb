import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { ArrayMinSize, IsArray, IsOptional, IsString, MaxLength } from 'class-validator'

export class SubmitVibeCheckDto {
  @ApiProperty({ description: 'Ids of the chosen option for each answered question', type: [String] })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  answerIds: string[]

  // Anonymous-first (PRD §8) — the pre-auth session identifier the FE mints on
  // first quiz visit. Not a Clerk id; there is no auth guard on this route.
  @ApiProperty({ description: 'Pre-auth session identifier minted client-side on first quiz visit' })
  @IsString()
  @MaxLength(200)
  sessionId: string

  @ApiPropertyOptional({ description: 'shortId of the VibeCheckResult that referred this quiz-taker' })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  referredByShortId?: string
}
