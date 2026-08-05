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
  @ApiPropertyOptional({ type: Number }) @IsOptional() @Type(() => Number) @IsInt() yearBuiltMax?: number
  @ApiPropertyOptional({ type: Number }) @IsOptional() @Type(() => Number) @IsInt() parkingMin?: number

  /**
   * true = listing publishes a basement, false = publishes "None"/"N/A".
   * Omitted = no basement constraint.
   *
   * The `undefined` guard is load-bearing, unlike on `exactBedsBaths` above:
   * class-transformer runs @Transform even for absent properties, so the bare
   * `value === 'true'` form would turn every unfiltered search into
   * `basement=false` and silently restrict results to listings that explicitly
   * declare no basement.
   */
  @ApiPropertyOptional({ type: Boolean })
  @IsOptional()
  @Transform(({ value }) =>
    value === undefined ? undefined : value === true || value === 'true' || value === '1',
  )
  @IsBoolean()
  basement?: boolean

  /** Listed within the last N days (OriginalEntryTimestamp). */
  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  maxDaysListed?: number

  /**
   * Map viewport bounding box — triggers PostGIS spatial filter.
   * Format: `west,south,east,north`  (all decimal degrees)
   */
  @ApiPropertyOptional({ example: '-79.63,43.58,-79.27,43.85', description: 'west,south,east,north (decimal degrees)' })
  @IsOptional()
  @IsString()
  bbox?: string

  /**
   * Restrict to listings carrying a video tour — the feed's supply.
   *
   * Narrows to `MediaCategory: 'Video Tour Website'` at DDF, which is ~34% of
   * the feed and ~40% playable video once hosts are classified (vs ~14%
   * unfiltered) — a 2.9x density gain for the feed's fetch amplification.
   * DDF cannot filter finer: `contains(m/MediaURL, …)` and a bare
   * `Media/any()` both return HTTP 500, so host classification stays in
   * mapProperty via extractListingVideo.
   */
  @ApiPropertyOptional({ type: Boolean })
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true' || value === '1')
  @IsBoolean()
  videoOnly?: boolean

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
