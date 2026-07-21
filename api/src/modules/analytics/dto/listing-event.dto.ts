import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { IsIn, IsInt, IsOptional, IsString, MaxLength } from 'class-validator'
import type { CreaEventType } from '../crea-analytics.service'

/**
 * Body for `POST /analytics/listing-event`. The frontend calls this so the
 * DestinationId and the CREA LogEvents round-trip stay server-side.
 */
export class ListingEventDto {
  /** DDF ListingKey of the listing the event is about. */
  @ApiProperty({ description: 'DDF ListingKey the event refers to' })
  @IsString()
  @MaxLength(64)
  listingKey!: string

  @ApiProperty({
    enum: ['view', 'Click', 'email_realtor'],
    description: 'CREA event type',
  })
  @IsIn(['view', 'Click', 'email_realtor'])
  eventType!: CreaEventType

  /** Stable per-user / per-device id (the DestinationId is appended server-side). */
  @ApiProperty({ description: 'Stable per-user/device identifier' })
  @IsString()
  @MaxLength(128)
  uuid!: string

  @ApiPropertyOptional({ description: 'Referring URL' })
  @IsOptional()
  @IsString()
  @MaxLength(2048)
  referralUrl?: string

  @ApiPropertyOptional({ description: 'Language: 1 = English, 2 = French', enum: [1, 2] })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsIn([1, 2])
  languageId?: number
}
