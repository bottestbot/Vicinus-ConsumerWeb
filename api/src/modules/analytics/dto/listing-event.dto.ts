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

  /**
   * CREA-02: REMOVED. The visitor identifier is now issued server-side and
   * read from a signed HttpOnly cookie (see visitor-id.util.ts). A
   * caller-supplied uuid could simply be rotated per request, defeating CREA's
   * 5-minute dedup window and letting anyone inflate counts under our
   * DestinationId. Any `uuid` in the body is stripped by the global
   * ValidationPipe and ignored.
   */

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
