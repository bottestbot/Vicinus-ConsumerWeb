import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsOptional, IsString, MinLength } from 'class-validator'

export class SellPreviewDto {
  @ApiProperty({ description: 'Property address the seller entered on the intro screen' })
  @IsString()
  @MinLength(3)
  address: string

  @ApiPropertyOptional({ description: 'Step 1 — what matters most (maximize-profit | speed-certainty | perfect-timing)' })
  @IsOptional()
  @IsString()
  sellingPriority?: string

  @ApiPropertyOptional({ description: 'Step 2 — biggest hurdle (prep-repairs | next-home | fees | ready)' })
  @IsOptional()
  @IsString()
  biggestHurdle?: string

  @ApiPropertyOptional({ description: 'Step 3 — advisory preference (digital | phone | in-person)' })
  @IsOptional()
  @IsString()
  advisoryPreference?: string
}
