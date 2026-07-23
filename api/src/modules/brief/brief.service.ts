import { Injectable } from '@nestjs/common'
import { BriefFactsService } from './brief-facts.service'
import { BriefCopyService } from './brief-copy.service'
import type { BriefResponse } from './brief.types'

@Injectable()
export class BriefService {
  constructor(
    private readonly facts: BriefFactsService,
    private readonly copy: BriefCopyService,
  ) {}

  /** GET /users/me/brief — assemble the frozen contract payload. */
  async getBrief(clerkId: string): Promise<BriefResponse> {
    const facts = await this.facts.buildBriefFacts(clerkId)
    const copy = await this.copy.generate(facts)
    return {
      headline: copy.headline,
      body: copy.body,
      highlights: facts.highlights,
      generatedAt: facts.generatedAt,
      isFallback: copy.isFallback,
      isEmpty: facts.isEmpty,
    }
  }
}
