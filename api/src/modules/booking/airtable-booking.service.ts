import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

const AIRTABLE_API_BASE_URL = 'https://api.airtable.com/v0';

/** Table name used when AIRTABLE_DISCOVERY_CALL_TABLE is not set. */
const DEFAULT_TABLE = 'Discovery Call Bookings';

export interface DiscoveryCallBookingRecord {
  fullName: string;
  email: string;
  scheduledDate: Date;
  timeSlot: string;
  source: string;
}

/**
 * Mirrors Realtor Hub discovery-call bookings into an Airtable base, same
 * pattern as AirtableWaitlistService — the database stays the source of
 * truth; an Airtable automation ("When a record is created → Send email/
 * Slack") is what actually notifies the founder of a new booking.
 *
 * Best-effort by design: fire-and-forget, swallows errors, never blocks or
 * fails the booking.
 */
@Injectable()
export class AirtableBookingService {
  private readonly logger = new Logger(AirtableBookingService.name);

  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {}

  pushBooking(record: DiscoveryCallBookingRecord): void {
    const apiKey = this.config.get<string>('AIRTABLE_API_KEY');
    const baseId = this.config.get<string>('AIRTABLE_BASE_ID');
    if (!apiKey || !baseId) {
      this.logger.warn(
        `Airtable not configured — skipping booking mirror (apiKey=${apiKey ? 'set' : 'missing'}, baseId=${baseId ? 'set' : 'missing'})`,
      );
      return;
    }

    const table =
      this.config.get<string>('AIRTABLE_DISCOVERY_CALL_TABLE') || DEFAULT_TABLE;
    const url = `${AIRTABLE_API_BASE_URL}/${baseId}/${encodeURIComponent(table)}`;

    const body = {
      typecast: true,
      fields: {
        Name: record.fullName,
        Email: record.email,
        Date: record.scheduledDate.toISOString().slice(0, 10),
        'Time Slot': record.timeSlot,
        Source: record.source,
      },
    };

    firstValueFrom(
      this.http.post(url, body, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      }),
    ).catch((err: unknown) => {
      this.logger.warn(
        `Airtable booking mirror failed: ${(err as Error).message}`,
      );
    });
  }
}
