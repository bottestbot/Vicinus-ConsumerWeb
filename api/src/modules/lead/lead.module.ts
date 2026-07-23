import { Module } from '@nestjs/common'
import { HttpModule } from '@nestjs/axios'
import { DdfSyncModule } from '../ddf-sync/ddf-sync.module'
import { LeadController } from './lead.controller'
import { LeadService } from './lead.service'
import { AirtableLeadService } from './airtable-lead.service'
import { CreaLeadService } from './crea-lead.service'

@Module({
  // DdfSyncModule exports DdfAuthService, reused so the DDF OAuth token cache is
  // shared with the sync jobs rather than duplicated.
  imports: [HttpModule, DdfSyncModule],
  controllers: [LeadController],
  providers: [LeadService, AirtableLeadService, CreaLeadService],
})
export class LeadModule {}
