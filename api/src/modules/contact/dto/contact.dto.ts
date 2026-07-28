import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsEmail, IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator'

/** Optional intent the visitor selects — not a DDF/listing concept. */
export type ContactInterest = 'buy' | 'sell'

/**
 * Body for `POST /contact` — the homepage "Get in Touch" form. Unlike
 * `CreateLeadDto` this is not about a specific DDF listing: there is no
 * listingKey/propertyAddress and nothing here is forwarded to CREA's Lead API.
 * v1 mirrors the message into Airtable (same ops pattern as the property-lead
 * and realtor-waitlist mirrors) — see ContactService.
 */
export class ContactDto {
  @ApiProperty({ description: "Visitor's name" })
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string

  @ApiProperty({ description: "Visitor's email address" })
  @IsEmail()
  email!: string

  @ApiPropertyOptional({ description: "Visitor's phone number" })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  phone?: string

  @ApiPropertyOptional({ description: 'Message to the Vicinus team (max 500 chars)' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  message?: string

  @ApiPropertyOptional({
    description: 'Optional — whether the visitor is looking to buy or sell',
    enum: ['buy', 'sell'],
  })
  @IsOptional()
  @IsIn(['buy', 'sell'])
  interest?: ContactInterest

  // Honeypot: hidden field the FE never shows to humans. A non-empty value means
  // a bot filled it — the request is silently accepted-and-dropped. Mirrors the
  // lead/waitlist honeypot.
  @ApiPropertyOptional({ description: 'Anti-spam honeypot — must be empty' })
  @IsOptional()
  @IsString()
  company?: string
}
