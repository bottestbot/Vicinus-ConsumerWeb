import { Injectable, Logger } from '@nestjs/common'
import { CreateMortgageLeadDto } from './dto/create-mortgage-lead.dto'
import { AirtableMortgageService } from './airtable-mortgage.service'

@Injectable()
export class MortgageService {
  private readonly logger = new Logger(MortgageService.name)

  constructor(private readonly airtable: AirtableMortgageService) {}

  /**
   * Handle the Mortgage Analysis widget's "Contact Mortgage Broker" form.
   *
   * Returns `{ ok }`. Honeypot hits resolve `{ ok: true }` (accepted-and-dropped).
   */
  async submitInquiry(dto: CreateMortgageLeadDto): Promise<{ ok: boolean }> {
    // Honeypot tripped — a bot filled the hidden `company` field. Accept the
    // request so the bot gets a normal response, but drop it silently.
    if (dto.company && dto.company.trim().length > 0) {
      this.logger.warn('Rejected mortgage inquiry (honeypot filled)')
      return { ok: true }
    }

    const record = {
      listingKey: dto.listingKey?.trim() || null,
      propertyAddress: dto.propertyAddress?.trim() || null,
      name: dto.name.trim(),
      email: dto.email.trim().toLowerCase(),
      phone: dto.phone?.trim() || null,
      message: dto.message?.trim() || null,
      source: 'mortgage-inquiry',
    }

    const ok = await this.airtable.pushLead(record)
    if (!ok) {
      this.logger.error('Mortgage inquiry delivery failed (airtable=false)')
      return { ok: false }
    }

    this.logger.log('Mortgage inquiry captured')
    return { ok: true }
  }
}
