import { Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { GoogleGenerativeAI, Schema, SchemaType } from '@google/generative-ai'
import { SearchService } from '../search/search.service'
import { RedisService } from '../../common/redis/redis.service'
import { PrismaService } from '../../prisma/prisma.service'

const SUMMARY_TTL = 4 * 60 * 60 // 4 hours
const NEIGHBOURHOOD_SUMMARY_TTL = 24 * 60 * 60 // 24 hours

const NEIGHBOURHOOD_SECTION = {
  type: SchemaType.OBJECT,
  properties: {
    heading: { type: SchemaType.STRING },
    points: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
  },
  required: ['heading', 'points'],
}

const NEIGHBOURHOOD_SCHEMA: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    safety: NEIGHBOURHOOD_SECTION,
    dailyLife: NEIGHBOURHOOD_SECTION,
    schools: NEIGHBOURHOOD_SECTION,
    growth: NEIGHBOURHOOD_SECTION,
  },
  required: ['safety', 'dailyLife', 'schools', 'growth'],
}

const RESPONSE_SCHEMA: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    propertyOverview: {
      type: SchemaType.OBJECT,
      properties: {
        summary: { type: SchemaType.STRING },
        bullets: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
        chips: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
      },
      required: ['summary', 'bullets', 'chips'],
    },
    lifestyleFit: {
      type: SchemaType.OBJECT,
      properties: {
        summary: { type: SchemaType.STRING },
        chips: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
      },
      required: ['summary', 'chips'],
    },
  },
  required: ['propertyOverview', 'lifestyleFit'],
}

// ---------------------------------------------------------------------------

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name)
  private readonly genAI: GoogleGenerativeAI

  constructor(
    private readonly config: ConfigService,
    private readonly search: SearchService,
    private readonly redis: RedisService,
    private readonly prisma: PrismaService,
  ) {
    this.genAI = new GoogleGenerativeAI(this.config.getOrThrow('GEMINI_API_KEY'))
  }

  async getPropertySummary(listingKey: string) {
    const cacheKey = `ai:property-summary:${listingKey}`
    const cached = await this.redis.get(cacheKey)
    if (cached) return JSON.parse(cached)

    return this.generate(listingKey, cacheKey)
  }

  async regeneratePropertySummary(listingKey: string) {
    const cacheKey = `ai:property-summary:${listingKey}`
    await this.redis.del(cacheKey)
    return this.generate(listingKey, cacheKey)
  }

  // ---------------------------------------------------------------------------

  private async generate(listingKey: string, cacheKey: string) {
    const property = await this.search.getListing(listingKey)
    if (!property) throw new NotFoundException(`Listing ${listingKey} not found`)

    const model = this.genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: RESPONSE_SCHEMA,
      },
    })

    let result: unknown
    try {
      const response = await model.generateContent(this.buildPrompt(property))
      result = JSON.parse(response.response.text())
    } catch (err) {
      this.logger.error(`Gemini failed for listing ${listingKey}: ${(err as Error).message}`)
      throw new InternalServerErrorException('Failed to generate property summary')
    }

    await this.redis.set(cacheKey, JSON.stringify(result), SUMMARY_TTL)
    return result
  }

  // ---------------------------------------------------------------------------

  async getNeighbourhoodSummary(slug: string) {
    const cacheKey = `ai:neighbourhood-summary:${slug}`
    const cached = await this.redis.get(cacheKey)
    if (cached) return JSON.parse(cached)

    const row = await this.prisma.neighbourhood.findUnique({
      where: { slug },
      select: { name: true, city: true },
    })
    if (!row) throw new NotFoundException(`Neighbourhood "${slug}" not found`)

    const model = this.genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: NEIGHBOURHOOD_SCHEMA,
      },
    })

    let result: unknown
    try {
      const response = await model.generateContent(this.buildNeighbourhoodPrompt(row.name, row.city ?? ''))
      result = JSON.parse(response.response.text())
    } catch (err) {
      this.logger.error(`Gemini failed for neighbourhood ${slug}: ${(err as Error).message}`)
      throw new InternalServerErrorException('Failed to generate neighbourhood summary')
    }

    await this.redis.set(cacheKey, JSON.stringify(result), NEIGHBOURHOOD_SUMMARY_TTL)
    return result
  }

  // ---------------------------------------------------------------------------

  private buildNeighbourhoodPrompt(name: string, city: string): string {
    return `Act as an expert real estate research assistant. Your task is to analyze and summarize data about the following neighborhood: ${name}, ${city}.

Provide an encouraging, positive, and inviting summary that highlights the best features of this area. For each category below, populate the heading field with the section name and the points field with 2–3 specific bullet strings.

Categories:
- safety: heading "Safety & Welcoming Vibe" — general safety, community spirit, overall positive feel of the neighborhood
- dailyLife: heading "Daily Life & Convenience" — walkability, transit options, proximity to daily essentials (grocery stores, gyms, parks, hospitals), easy commute times to downtown
- schools: heading "Schools & Families" — local school district strengths, family-friendly amenities, parks, and activities
- growth: heading "Growth & Prosperity" — positive property value trends, upcoming city enhancements, new parks, or upscale commercial developments

Keep the tone objective yet uplifting, focusing on why a homebuyer would love to live in this community.`
  }

  private buildPrompt(p: Record<string, any>): string {
    const fmt = (n: number | null | undefined) =>
      n != null ? `$${n.toLocaleString('en-CA')}` : null

    const price = p['price'] as number | null
    const sqft = p['sqft'] as number | null
    const pricePerSqft =
      price != null && price > 0 && sqft != null && sqft > 0
        ? Math.round(price / sqft)
        : null

    const listedAt = p['listedAt'] ? new Date(p['listedAt'] as string) : null
    const daysOnMarket = listedAt
      ? Math.max(0, Math.floor((Date.now() - listedAt.getTime()) / 86_400_000))
      : null

    const details = p['details'] as Record<string, any> | undefined
    const interior = details?.interior as Record<string, any> | undefined
    const exterior = details?.exterior as Record<string, any> | undefined

    const featureList: string[] = [
      ...(interior?.heating ?? []),
      ...(interior?.cooling ?? []),
      ...(interior?.basement ?? []),
      ...(interior?.flooring ?? []),
      ...(exterior?.constructionMaterials ?? []),
    ].filter(Boolean)

    const facts = [
      `Address: ${p['address'] ?? 'unknown'}, ${p['city'] ?? ''}, ${p['province'] ?? ''}`,
      `Type: ${p['propertySubType'] ?? 'Residential'}`,
      `Price: ${fmt(price) ?? 'not disclosed'}`,
      sqft ? `Size: ${sqft.toLocaleString('en-CA')} sqft` : null,
      `Beds / Baths: ${p['beds'] ?? '?'} bed / ${p['baths'] ?? '?'} bath`,
      p['yearBuilt'] ? `Year built: ${p['yearBuilt']}` : null,
      daysOnMarket != null ? `Days on market: ${daysOnMarket}` : null,
      pricePerSqft ? `Price per sqft: $${pricePerSqft}/sqft` : null,
      featureList.length ? `Key features: ${featureList.slice(0, 6).join(', ')}` : null,
      p['description']
        ? `Listing description: ${(p['description'] as string).slice(0, 600)}`
        : null,
    ]
      .filter(Boolean)
      .map((f) => `- ${f}`)
      .join('\n')

    return `You are a real estate advisor writing a property summary for a premium Canadian real estate platform.

Property data:
${facts}

Write two sections. Each must have:
- "summary": 3–4 sentences of fluent, editorial prose. Confident and specific. No hype.
- "chips": exactly 3 short keyword labels (2–4 words each) that capture the key takeaways.

Section 1 — propertyOverview: what this property actually is: standout physical features, condition, build quality, honest read of what the price reflects. Also include a "bullets" field: an array of 3–5 concise bullet point strings listing the standout features (e.g. "Radiant in-floor heating", "Freehold strata").

Section 2 — lifestyleFit: who this property suits, neighbourhood character, nearby attractions, restaurants, walkability, day-to-day quality of life.

Tone: editorial, premium, direct. Like advice from a trusted friend who happens to know the market cold.
Do not mention Vicinus. Do not give explicit financial or legal advice. If a data point is missing, omit it rather than guessing.`
  }
}
