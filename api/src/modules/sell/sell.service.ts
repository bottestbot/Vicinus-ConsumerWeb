import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { GoogleGenerativeAI, Schema, SchemaType } from '@google/generative-ai'
import { Prisma } from '@prisma/client'
import { PrismaService } from '../../prisma/prisma.service'
import { SellValuationDto } from './dto/sell-valuation.dto'

// Shape Gemini must return — drives the valuation detail screen.
const VALUATION_SCHEMA: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    tagline: { type: SchemaType.STRING },
    estimatedValueLow: { type: SchemaType.NUMBER },
    estimatedValueHigh: { type: SchemaType.NUMBER },
    confidenceScore: { type: SchemaType.NUMBER },
    pricePerSqFt: { type: SchemaType.STRING },
    estimatedYield: { type: SchemaType.STRING },
    daysOnMarket: { type: SchemaType.STRING },
    strategyNote: { type: SchemaType.STRING },
    marketPulse: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          title: { type: SchemaType.STRING },
          body: { type: SchemaType.STRING },
        },
        required: ['title', 'body'],
      },
    },
    comparables: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          address: { type: SchemaType.STRING },
          soldPrice: { type: SchemaType.STRING },
          soldDate: { type: SchemaType.STRING },
          beds: { type: SchemaType.NUMBER },
          baths: { type: SchemaType.NUMBER },
          sqft: { type: SchemaType.NUMBER },
          distance: { type: SchemaType.STRING },
          comparability: { type: SchemaType.STRING },
        },
        required: ['address', 'soldPrice', 'soldDate', 'beds', 'baths', 'sqft', 'distance', 'comparability'],
      },
    },
  },
  required: [
    'tagline',
    'estimatedValueLow',
    'estimatedValueHigh',
    'confidenceScore',
    'pricePerSqFt',
    'estimatedYield',
    'daysOnMarket',
    'strategyNote',
    'marketPulse',
    'comparables',
  ],
}

@Injectable()
export class SellService {
  private readonly logger = new Logger(SellService.name)
  private readonly genAI: GoogleGenerativeAI

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.genAI = new GoogleGenerativeAI(this.config.getOrThrow('GEMINI_API_KEY'))
  }

  // Persists the seller lead, generates a Gemini valuation, caches it on the lead, returns it.
  async createValuation(dto: SellValuationDto) {
    const valuation = await this.generateValuation(dto)

    try {
      await this.prisma.sellerLead.create({
        data: {
          address: dto.address,
          sellingPriority: dto.sellingPriority,
          biggestHurdle: dto.biggestHurdle,
          advisoryPreference: dto.advisoryPreference,
          firstName: dto.firstName,
          lastName: dto.lastName,
          email: dto.email,
          phone: dto.phone,
          valuation: valuation as Prisma.InputJsonValue,
        },
      })
    } catch (err) {
      // Lead capture is best-effort — never block the seller from seeing their valuation.
      this.logger.error(`Failed to persist seller lead: ${(err as Error).message}`)
    }

    return { address: dto.address, ...valuation }
  }

  // ---------------------------------------------------------------------------

  private async generateValuation(dto: SellValuationDto) {
    const model = this.genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: VALUATION_SCHEMA,
      },
    })

    try {
      const response = await model.generateContent(this.buildPrompt(dto))
      return JSON.parse(response.response.text())
    } catch (err) {
      this.logger.error(`Gemini valuation failed: ${(err as Error).message}`)
      return this.fallbackValuation(dto)
    }
  }

  private buildPrompt(dto: SellValuationDto): string {
    return [
      'You are a senior Canadian real-estate valuation analyst for Vicinus, a luxury property platform.',
      'A homeowner is considering selling and has given the details below. Produce a realistic, illustrative',
      'market valuation for the address. Infer the local market from the city/neighbourhood in the address.',
      'All currency is CAD. Be specific and credible; do not include disclaimers in the fields.',
      '',
      `Address: ${dto.address}`,
      dto.sellingPriority ? `Seller's top priority: ${dto.sellingPriority}` : '',
      dto.biggestHurdle ? `Biggest hurdle: ${dto.biggestHurdle}` : '',
      dto.advisoryPreference ? `Preferred advisory style: ${dto.advisoryPreference}` : '',
      '',
      'Guidance:',
      '- estimatedValueLow/High: a tight CAD range (raw numbers, no formatting).',
      '- confidenceScore: 80-99.',
      '- pricePerSqFt / estimatedYield / daysOnMarket: short display strings (e.g. "$1,140", "4.2%", "12 Days").',
      '- tagline: one elegant sentence describing the home.',
      '- strategyNote: a one-sentence strategic recommendation tailored to the seller priority.',
      '- marketPulse: 2 items (title + 1-sentence body) on local inventory and demand.',
      '- comparables: exactly 3 recently-sold comparable homes near the address with believable details.',
    ]
      .filter(Boolean)
      .join('\n')
  }

  // Used when GEMINI_API_KEY is a placeholder or the call fails, so the flow still renders.
  private fallbackValuation(dto: SellValuationDto) {
    return {
      tagline: 'A distinctive home positioned in a sought-after Canadian market.',
      estimatedValueLow: 2_850_000,
      estimatedValueHigh: 3_050_000,
      confidenceScore: 92,
      pricePerSqFt: '$1,140',
      estimatedYield: '4.2%',
      daysOnMarket: '14 Days',
      strategyNote:
        'Current micro-market conditions favour a confident list price with room for competitive offers.',
      marketPulse: [
        { title: 'Low Inventory', body: 'Available listings in this district are near multi-year lows, driving competitive premiums.' },
        { title: 'Rising Demand', body: 'Qualified buyer interest has climbed steadily month-over-month for comparable homes.' },
      ],
      comparables: [
        { address: '812 Heritage Heights', soldPrice: '$3.1M', soldDate: 'Nov 2023', beds: 4, baths: 4, sqft: 3800, distance: '1.2 km away', comparability: 'Direct Comparable' },
        { address: '45 Oak Creek Pass', soldPrice: '$2.9M', soldDate: 'Oct 2023', beds: 3, baths: 3, sqft: 3200, distance: '0.8 km away', comparability: 'Direct Comparable' },
        { address: '1200 Vista Court', soldPrice: '$3.35M', soldDate: 'Jan 2024', beds: 5, baths: 5, sqft: 4500, distance: '2.1 km away', comparability: 'Premium Comparable' },
      ],
    }
  }
}
