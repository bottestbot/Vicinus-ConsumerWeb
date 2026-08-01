import { ConflictException, Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { BookDiscoveryCallDto } from './dto/book-discovery-call.dto';
import { AirtableBookingService } from './airtable-booking.service';

@Injectable()
export class BookingService {
  private readonly logger = new Logger(BookingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly airtable: AirtableBookingService,
  ) {}

  // Persist a discovery-call request. Unique on (scheduledDate, timeSlot) so
  // two Realtors can't land the same slot — a race loses with a 409.
  async bookDiscoveryCall(dto: BookDiscoveryCallDto): Promise<{ ok: true }> {
    // Honeypot tripped — a bot filled the hidden `company` field. Accept the
    // request so the bot gets a normal response, but drop it silently.
    if (dto.company && dto.company.trim().length > 0) {
      this.logger.warn('Rejected discovery-call booking (honeypot filled)');
      return { ok: true };
    }

    const scheduledDate = new Date(`${dto.date}T00:00:00.000Z`);

    const data = {
      fullName: dto.fullName.trim(),
      email: dto.email.trim().toLowerCase(),
      scheduledDate,
      timeSlot: dto.timeSlot.trim(),
      source: 'realtor-hub',
    };

    try {
      await this.prisma.discoveryCallBooking.create({ data });
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        throw new ConflictException(
          'That time slot was just booked — please pick another.',
        );
      }
      throw err;
    }

    // Mirror into Airtable, where an automation notifies the founder of the
    // new booking. Fire-and-forget — never blocks or fails the request.
    this.airtable.pushBooking(data);
    this.logger.log('New discovery-call booking captured');

    return { ok: true };
  }
}
