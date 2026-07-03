import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator'

export class JoinWaitlistDto {
  @ApiProperty({ description: 'Realtor full name' })
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  fullName: string

  @ApiProperty({ description: 'Professional email address' })
  @IsEmail()
  email: string

  @ApiPropertyOptional({ description: 'Brokerage the Realtor works with' })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  brokerage?: string

  @ApiPropertyOptional({ description: 'Primary city / market they operate in' })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  cityMarket?: string

  // Honeypot: hidden field the FE never shows to humans. A non-empty value
  // means a bot filled it — the request is silently accepted-and-dropped.
  @ApiPropertyOptional({ description: 'Anti-spam honeypot — must be empty' })
  @IsOptional()
  @IsString()
  company?: string
}
