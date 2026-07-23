import { Injectable, Logger } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { CreateLeadDto } from './dto/create-lead.dto'
import { AirtableLeadService } from './airtable-lead.service'
import { CreaLeadService, CreaLeadOutcome } from './crea-lead.service'

@Injectable()
export class LeadService {
  private readonly logger = new Logger(LeadService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly creaLead: CreaLeadService,
    private readonly airtable: AirtableLeadService,
  ) {}

  /**
   * Handle a buyer's "Email REALTOR®" inquiry from a listing's Send Message form.
   *
   * Two deliveries run per inquiry:
   *  - CREA DDF Lead API `CreateLead` — the REAW-tier compliant path that
   *    reaches the listing REALTOR® (config-gated; see CreaLeadService).
   *  - Airtable mirror — the team's internal copy (Realtor Hub waitlist pattern).
   *
   * Returns `{ ok }`. Honeypot hits resolve `{ ok: true }` (accepted-and-dropped).
   * `ok` is true when either delivery succeeded, so the buyer only sees an error
   * when the inquiry reached neither CREA nor our own records.
   */
  async submitInquiry(dto: CreateLeadDto): Promise<{ ok: boolean }> {
    // Honeypot tripped — a bot filled the hidden `company` field. Accept the
    // request so the bot gets a normal response, but drop it silently.
    if (dto.company && dto.company.trim().length > 0) {
      this.logger.warn('Rejected property inquiry (honeypot filled)')
      return { ok: true }
    }

    const record = {
      listingKey: dto.listingKey.trim(),
      propertyAddress: dto.propertyAddress?.trim() || null,
      name: dto.name.trim(),
      email: dto.email.trim().toLowerCase(),
      phone: dto.phone?.trim() || null,
      message: dto.message?.trim() || null,
      source: 'property-inquiry',
    }

    // CreateLead needs the listing agent's MemberKey, which we resolve from the
    // listing rather than trust from the client. Property.ddfAgentKey references
    // Agent.ddfMemberKey (see schema.prisma).
    const memberKey = await this.resolveMemberKey(record.listingKey)

    let creaOutcome: CreaLeadOutcome = 'skipped'
    if (memberKey) {
      creaOutcome = await this.creaLead.createLead({
        memberKey,
        listingKey: record.listingKey,
        senderName: record.name,
        senderEmail: record.email,
        senderPhone: record.phone,
        preferredMethodContact: dto.preferredMethodContact ?? 'email',
        // Message is required by CreateLead; supply a sensible default if blank.
        message:
          record.message ||
          `I'm interested in ${record.propertyAddress ?? 'this listing'}. Please get in touch.`,
      })
    } else {
      // No agent on the listing — CreateLead can't be addressed. Still mirror to
      // Airtable so the lead isn't lost; the team can route it manually.
      this.logger.warn(
        `No MemberKey for listing ${record.listingKey} — CreateLead not attempted, Airtable only`,
      )
    }

    const airtableOk = await this.airtable.pushLead(record)

    const ok = creaOutcome === 'delivered' || airtableOk
    if (!ok) {
      // Never logs PII — only the listing and outcome.
      this.logger.error(
        `Property inquiry delivery failed for listing ${record.listingKey} (crea=${creaOutcome}, airtable=false)`,
      )
      return { ok: false }
    }

    this.logger.log(
      `Property inquiry captured for listing ${record.listingKey} (crea=${creaOutcome}, airtable=${airtableOk})`,
    )
    return { ok: true }
  }

  /** Resolve the listing agent's DDF MemberKey from the ListingKey. */
  private async resolveMemberKey(listingKey: string): Promise<string | null> {
    const property = await this.prisma.property.findUnique({
      where: { ddfListingKey: listingKey },
      select: { ddfAgentKey: true },
    })
    return property?.ddfAgentKey ?? null
  }
}
