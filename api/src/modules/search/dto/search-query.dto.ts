import { ApiPropertyOptional } from '@nestjs/swagger'
import { Transform, Type } from 'class-transformer'
import { IsBoolean, IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator'

export class SearchQueryDto {
  /** Free-text — matched against address, city, province, description */
  @ApiPropertyOptional({ description: 'Free-text search (address, city, description)' })
  @IsOptional()
  @IsString()
  q?: string

  @ApiPropertyOptional() @IsOptional() @IsString() city?: string
  @ApiPropertyOptional() @IsOptional() @IsString() province?: string

  @ApiPropertyOptional({ type: Number }) @IsOptional() @Type(() => Number) @IsNumber() minPrice?: number
  @ApiPropertyOptional({ type: Number }) @IsOptional() @Type(() => Number) @IsNumber() maxPrice?: number

  /** Bedrooms — minimum by default, exact when `exactBedsBaths` is true */
  @ApiPropertyOptional({ type: Number }) @IsOptional() @Type(() => Number) @IsInt() @Min(0) beds?: number
  /** Bathrooms — minimum by default, exact when `exactBedsBaths` is true */
  @ApiPropertyOptional({ type: Number }) @IsOptional() @Type(() => Number) @IsNumber() baths?: number

  /** When true, beds/baths match exactly (eq) instead of the default "N+" (ge). */
  @ApiPropertyOptional({ type: Boolean })
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true' || value === '1')
  @IsBoolean()
  exactBedsBaths?: boolean

  /**
   * Comma-separated property sub-types.
   * e.g. `propertyType=Single+Family,Condo`
   */
  @ApiPropertyOptional({ description: 'Comma-separated sub-types: Single Family, Condo, Townhouse, …' })
  @IsOptional()
  @IsString()
  propertyType?: string

  /**
   * Comma-separated DDF `StructureType` values (dwelling form) — the field that
   * actually distinguishes House / Condo / Townhouse etc.
   * e.g. `structureType=House,Apartment`
   */
  @ApiPropertyOptional({ description: 'Comma-separated StructureType: House, Apartment, Row / Townhouse, …' })
  @IsOptional()
  @IsString()
  structureType?: string

  /** Listing status — defaults to "Active" */
  @ApiPropertyOptional({ example: 'Active' }) @IsOptional() @IsString() status?: string

  /** "For Sale" (default) or "For Rent" — sale listings have no LeaseAmount */
  @ApiPropertyOptional({ example: 'For Sale' }) @IsOptional() @IsString() listingType?: string

  @ApiPropertyOptional({ type: Number }) @IsOptional() @Type(() => Number) @IsInt() minSqft?: number
  @ApiPropertyOptional({ type: Number }) @IsOptional() @Type(() => Number) @IsInt() maxSqft?: number

  @ApiPropertyOptional({ type: Number }) @IsOptional() @Type(() => Number) @IsInt() yearBuiltMin?: number
  @ApiPropertyOptional({ type: Number }) @IsOptional() @Type(() => Number) @IsInt() parkingMin?: number

  /**
   * Map viewport bounding box — triggers PostGIS spatial filter.
   * Format: `west,south,east,north`  (all decimal degrees)
   */
  @ApiPropertyOptional({ example: '-79.63,43.58,-79.27,43.85', description: 'west,south,east,north (decimal degrees)' })
  @IsOptional()
  @IsString()
  bbox?: string

  @ApiPropertyOptional({ type: Number, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Transform(({ value }) => value ?? 1)
  page?: number = 1

  @ApiPropertyOptional({ type: Number, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Transform(({ value }) => value ?? 20)
  limit?: number = 20
}
