import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { BookingController } from './booking.controller';
import { BookingService } from './booking.service';
import { AirtableBookingService } from './airtable-booking.service';

@Module({
  imports: [HttpModule],
  controllers: [BookingController],
  providers: [BookingService, AirtableBookingService],
})
export class BookingModule {}
