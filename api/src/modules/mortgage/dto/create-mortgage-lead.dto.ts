import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator'

/**
 * Body for `POST /mortgage/inquiry` — the Mortgage Analysis widget's "Contact
 * Mortgage Broker" form. Not tied to CREA's DDF Lead API (no listing REALTOR®
 * involved) — v1 just mirrors the message into Airtable, same pattern as
 * ContactDto/CreateLeadDto.
 */
export class CreateMortgageLeadDto {
  @ApiPropertyOptional({ description: 'DDF ListingKey the inquiry refers to, if any' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  listingKey?: string

  @ApiPropertyOptional({ description: 'Listing address, for the notification subject line' })
  @IsOptional()
  @IsString()
  @MaxLength(240)
  propertyAddress?: string

  @ApiProperty({ description: "Buyer's name" })
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string

  @ApiProperty({ description: "Buyer's email address" })
  @IsEmail()
  email!: string

  @ApiPropertyOptional({ description: "Buyer's phone number" })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  phone?: string

  @ApiPropertyOptional({ description: 'Message to the mortgage broker (max 500 chars)' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  message?: string

  // Honeypot: hidden field the FE never shows to humans. A non-empty value means
  // a bot filled it — the request is silently accepted-and-dropped. Mirrors the
  // lead/contact/waitlist honeypot.
  @ApiPropertyOptional({ description: 'Anti-spam honeypot — must be empty' })
  @IsOptional()
  @IsString()
  company?: string
}
