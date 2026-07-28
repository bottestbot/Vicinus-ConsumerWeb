import { Injectable, Logger } from '@nestjs/common'
import { ContactDto } from './dto/contact.dto'
import { AirtableContactService } from './airtable-contact.service'

@Injectable()
export class ContactService {
  private readonly logger = new Logger(ContactService.name)

  constructor(private readonly airtable: AirtableContactService) {}

  /**
   * Handle the homepage "Get in Touch" form. Not tied to any DDF listing — no
   * CREA/DDF Lead API call is made here, unlike LeadService.submitInquiry.
   *
   * Returns `{ ok }`. Honeypot hits resolve `{ ok: true }` (accepted-and-dropped).
   */
  async submitContact(dto: ContactDto): Promise<{ ok: boolean }> {
    // Honeypot tripped — a bot filled the hidden `company` field. Accept the
    // request so the bot gets a normal response, but drop it silently.
    if (dto.company && dto.company.trim().length > 0) {
      this.logger.warn('Rejected contact submission (honeypot filled)')
      return { ok: true }
    }

    const record = {
      name: dto.name.trim(),
      email: dto.email.trim().toLowerCase(),
      phone: dto.phone?.trim() || null,
      message: dto.message?.trim() || null,
      interest: dto.interest ?? null,
      source: 'homepage-contact',
    }

    const ok = await this.airtable.pushContact(record)
    if (!ok) {
      this.logger.error('Contact submission delivery failed (airtable=false)')
      return { ok: false }
    }

    this.logger.log('Contact submission captured')
    return { ok: true }
  }
}
