import { Module } from '@nestjs/common'
import { HttpModule } from '@nestjs/axios'
import { WaitlistController } from './waitlist.controller'
import { WaitlistService } from './waitlist.service'
import { AirtableWaitlistService } from './airtable-waitlist.service'

@Module({
  imports: [HttpModule],
  controllers: [WaitlistController],
  providers: [WaitlistService, AirtableWaitlistService],
})
export class WaitlistModule {}
