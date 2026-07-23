import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsEmail, IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator'

/** CreateLead's PreferredMethodContact values. */
export type PreferredMethodContact = 'email' | 'phone' | 'text'

/**
 * Body for `POST /lead/inquiry` — a buyer's "Email REALTOR®" inquiry submitted
 * from a listing's Send Message form.
 *
 * v1 mirrors the inquiry into Airtable (an automation emails the team, mirroring
 * the Realtor Hub waitlist pattern). The CREA DDF Lead API (`CreateLead`) is the
 * compliant delivery path that reaches the listing REALTOR®; it is stubbed until
 * our DDF credentials are provisioned for a write scope — see LeadService.
 */
export class CreateLeadDto {
  /** DDF ListingKey the inquiry is about (equals PropertyDetail.id). */
  @ApiProperty({ description: 'DDF ListingKey the inquiry refers to' })
  @IsString()
  @MaxLength(64)
  listingKey!: string

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

  // Capped at 500 to match the DDF Lead API CreateLead `Message` limit, so the
  // same text can be forwarded to CREA verbatim.
  @ApiPropertyOptional({ description: 'Message to the REALTOR® (max 500 chars)' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  message?: string

  @ApiPropertyOptional({
    description: 'Preferred contact method — email | phone | text (CreateLead requires this)',
    enum: ['email', 'phone', 'text'],
  })
  @IsOptional()
  @IsIn(['email', 'phone', 'text'])
  preferredMethodContact?: PreferredMethodContact

  // Honeypot: hidden field the FE never shows to humans. A non-empty value means
  // a bot filled it — the request is silently accepted-and-dropped. Mirrors the
  // Realtor Hub waitlist honeypot.
  @ApiPropertyOptional({ description: 'Anti-spam honeypot — must be empty' })
  @IsOptional()
  @IsString()
  company?: string
}
