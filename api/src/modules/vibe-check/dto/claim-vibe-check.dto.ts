import { ApiProperty } from '@nestjs/swagger'
import { IsString, MaxLength } from 'class-validator'

export class ClaimVibeCheckDto {
  // Same pre-auth session identifier minted client-side on first quiz visit
  // and sent with /vibe-check/submit — this is how an anonymous quiz result
  // gets matched up to the now-authenticated caller.
  @ApiProperty({ description: 'Pre-auth session identifier minted client-side on first quiz visit' })
  @IsString()
  @MaxLength(200)
  sessionId: string
}
