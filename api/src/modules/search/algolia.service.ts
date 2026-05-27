import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { algoliasearch, SearchClient } from 'algoliasearch'
import { Agent, Office, Property } from '@prisma/client'

export type PropertyWithRelations = Property & {
  agent: Agent | null
  office: Office | null
}

export interface AlgoliaPropertyRecord {
  objectID: string
  ddfListingKey: string
  title: string
  city: string | null
  province: string | null
  postalCode: string | null
  price: number | null
  beds: number | null
  baths: number | null
  sqft: number | null
  propertySubType: string | null
  status: string
  isCuratorPick: boolean
  _geoloc: { lat: number; lng: number } | null
  primaryImageUrl: string | null
  agentName: string | null
  brokerageName: string | null
  realtorUrl: string
}

@Injectable()
export class AlgoliaService {
  private readonly logger = new Logger(AlgoliaService.name)
  private client: SearchClient | null = null
  static readonly INDEX_NAME = 'vicinus_properties'

  constructor(private config: ConfigService) {}

  /** Lazy-initialise the Algolia client — gracefully no-ops if credentials are absent. */
  private getClient(): SearchClient | null {
    if (this.client) return this.client
    const appId = this.config.get<string>('ALGOLIA_APP_ID')
    const apiKey = this.config.get<string>('ALGOLIA_ADMIN_KEY')
    if (!appId || !apiKey) {
      this.logger.warn('Algolia credentials not configured — indexing skipped')
      return null
    }
    this.client = algoliasearch(appId, apiKey)
    return this.client
  }

  /**
   * Push an array of pre-mapped Algolia records to the index.
   * Batches internally by chunks of 1000 (Algolia limit).
   */
  async indexProperties(records: AlgoliaPropertyRecord[]): Promise<void> {
    const client = this.getClient()
    if (!client || records.length === 0) return

    const CHUNK = 1000
    for (let i = 0; i < records.length; i += CHUNK) {
      const chunk = records.slice(i, i + CHUNK)
      try {
        await client.saveObjects({ indexName: AlgoliaService.INDEX_NAME, objects: chunk })
        this.logger.log(`Algolia: indexed ${chunk.length} properties (offset ${i})`)
      } catch (err) {
        this.logger.error(`Algolia indexing failed at offset ${i}: ${(err as Error).message}`)
      }
    }
  }

  /**
   * Map Prisma Property rows (with joined agent/office) to Algolia records and index them.
   * Called after every DDF property sync batch.
   */
  async indexFromPrisma(properties: PropertyWithRelations[]): Promise<void> {
    if (properties.length === 0) return
    const records = properties.map((p) => this.mapToRecord(p))
    await this.indexProperties(records)
  }

  /**
   * Full-text search via Algolia — returns raw Algolia hits.
   * Returns `null` when Algolia is not configured (callers fall back to Prisma).
   */
  async searchProperties(
    query: string,
    options?: { filters?: string; page?: number; hitsPerPage?: number },
  ) {
    const client = this.getClient()
    if (!client) return null
    try {
      const result = await client.search({
        requests: [
          {
            indexName: AlgoliaService.INDEX_NAME,
            query,
            filters: options?.filters,
            page: options?.page ?? 0,
            hitsPerPage: options?.hitsPerPage ?? 20,
          },
        ],
      })
      return result.results[0]
    } catch (err) {
      this.logger.error(`Algolia search failed: ${(err as Error).message}`)
      return null
    }
  }

  // ─── Mapping ─────────────────────────────────────────────────────────────

  mapToRecord(p: PropertyWithRelations): AlgoliaPropertyRecord {
    const images = p.images as Array<{ url: string; isPrimary?: boolean; order?: number }> | null
    const primaryImageUrl =
      images?.find((i) => i.isPrimary)?.url ??
      images?.sort((a, b) => (a.order ?? 99) - (b.order ?? 99))[0]?.url ??
      null

    const titleParts = [p.address, p.city, p.province].filter(Boolean)
    const title = titleParts.length > 0 ? titleParts.join(', ') : p.ddfListingKey

    return {
      objectID: p.id,
      ddfListingKey: p.ddfListingKey,
      title,
      city: p.city,
      province: p.province,
      postalCode: p.postalCode,
      price: p.price,
      beds: p.beds,
      baths: p.baths,
      sqft: p.sqft,
      propertySubType: p.propertySubType,
      status: p.status,
      isCuratorPick: p.isCuratorPick,
      _geoloc: p.lat != null && p.lng != null ? { lat: p.lat, lng: p.lng } : null,
      primaryImageUrl,
      agentName: p.agent?.fullName ?? null,
      brokerageName: p.office?.name ?? null,
      realtorUrl: p.realtorUrl,
    }
  }
}
