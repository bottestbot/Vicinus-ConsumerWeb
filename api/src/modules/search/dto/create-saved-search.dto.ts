import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsObject, IsOptional, IsString } from 'class-validator'

export class CreateSavedSearchDto {
  /** Human-readable label for this search, e.g. "Downtown Toronto condos" */
  @ApiPropertyOptional({ example: 'Downtown Toronto condos' })
  @IsOptional()
  @IsString()
  name?: string

  /**
   * Serialised filter state — matches the keys of `SearchQueryDto`
   * (q, city, minPrice, maxPrice, beds, baths, propertyType, etc.)
   */
  @ApiProperty({ description: 'Serialised filter state from SearchQueryDto' })
  @IsObject()
  filters: Record<string, unknown>
}
