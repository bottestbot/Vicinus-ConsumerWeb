import { Body, Controller, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { BookingService } from './booking.service';
import { BookDiscoveryCallDto } from './dto/book-discovery-call.dto';

@ApiTags('booking')
@Controller('booking')
export class BookingController {
  constructor(private readonly booking: BookingService) {}

  // POST /booking/discovery-call
  // Public — Realtor Hub landing page, before signup. Throttled like the
  // other lead-capture endpoints (waitlist/lead/contact) to prevent
  // slot-spamming.
  @Post('discovery-call')
  @Throttle({ default: { ttl: 60_000, limit: 8 } })
  @ApiOperation({ summary: 'Request a 15-minute Realtor Hub discovery call' })
  bookDiscoveryCall(@Body() dto: BookDiscoveryCallDto) {
    return this.booking.bookDiscoveryCall(dto);
  }
}
