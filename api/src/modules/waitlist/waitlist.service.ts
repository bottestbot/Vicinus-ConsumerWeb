import { Injectable, Logger } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { PrismaService } from '../../prisma/prisma.service'
import { JoinWaitlistDto } from './dto/join-waitlist.dto'
import { AirtableWaitlistService } from './airtable-waitlist.service'

@Injectable()
export class WaitlistService {
  private readonly logger = new Logger(WaitlistService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly airtable: AirtableWaitlistService,
  ) {}

  // Persist a Realtor Hub signup. Idempotent on email so a re-submit is a no-op
  // rather than an error. Never logs the email or name (PII).
  async joinRealtor(dto: JoinWaitlistDto): Promise<{ ok: true; alreadyJoined: boolean }> {
    // Honeypot tripped — a bot filled the hidden `company` field. Accept the
    // request so the bot gets a normal response, but drop it silently.
    if (dto.company && dto.company.trim().length > 0) {
      this.logger.warn('Rejected realtor-waitlist signup (honeypot filled)')
      return { ok: true, alreadyJoined: false }
    }

    const email = dto.email.trim().toLowerCase()

    const existing = await this.prisma.realtorWaitlist.findUnique({ where: { email } })
    if (existing) {
      return { ok: true, alreadyJoined: true }
    }

    const data = {
      fullName: dto.fullName.trim(),
      email,
      brokerage: dto.brokerage?.trim() || null,
      cityMarket: dto.cityMarket?.trim() || null,
      source: 'realtor-hub',
    }

    try {
      await this.prisma.realtorWaitlist.create({ data })
    } catch (err) {
      // Concurrent submit lost the unique-email race — treat as already joined.
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        return { ok: true, alreadyJoined: true }
      }
      throw err
    }

    // Mirror the signup into Airtable, where an automation emails ops about the
    // new record. Fire-and-forget — never blocks or fails the signup.
    this.airtable.pushRealtorSignup(data)

    // RH-BE-05: once the analytics pipeline (DATA-07) lands, also emit
    // `realtor_waitlist_submitted` here.
    this.logger.log('New realtor-waitlist signup captured')

    return { ok: true, alreadyJoined: false }
  }
}
