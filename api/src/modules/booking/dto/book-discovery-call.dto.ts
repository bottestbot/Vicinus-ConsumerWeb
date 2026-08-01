import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class BookDiscoveryCallDto {
  @ApiProperty({ description: 'Realtor full name' })
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  fullName: string;

  @ApiProperty({ description: 'Email address to send the confirmation to' })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Requested call date, ISO 8601 (e.g. 2026-08-19)',
  })
  @IsDateString()
  date: string;

  @ApiProperty({ description: 'Requested time slot, e.g. "9:00 AM"' })
  @IsString()
  @MaxLength(20)
  timeSlot: string;

  // Honeypot: hidden field the FE never shows to humans. A non-empty value
  // means a bot filled it — the request is silently accepted-and-dropped.
  @ApiPropertyOptional({ description: 'Anti-spam honeypot — must be empty' })
  @IsOptional()
  @IsString()
  company?: string;
}
