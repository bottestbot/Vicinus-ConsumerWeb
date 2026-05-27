import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { HttpService } from '@nestjs/axios'
import { firstValueFrom } from 'rxjs'
import { PrismaService } from '../../prisma/prisma.service'
import { DdfAuthService } from './ddf-auth.service'
import { AlgoliaService } from '../search/algolia.service'

@Injectable()
export class DdfPropertySync {
  private readonly logger = new Logger(DdfPropertySync.name)

  constructor(
    private auth: DdfAuthService,
    private http: HttpService,
    private prisma: PrismaService,
    private config: ConfigService,
    private algolia: AlgoliaService,
  ) {}

  async sync(since?: Date): Promise<number> {
    const token = await this.auth.getToken()
    const baseUrl = this.config.get<string>('DDF_API_BASE_URL')
    let url = `${baseUrl}/Property?$top=100&$orderby=ModificationTimestamp asc`
    if (since) url += `&$filter=ModificationTimestamp gt ${since.toISOString()}`

    let count = 0
    /** Track listing keys upserted in this run so we can batch-index to Algolia */
    const syncedListingKeys: string[] = []

    while (url) {
      const response = await firstValueFrom(
        this.http.get(url, {
          headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
        }),
      )

      const properties = (response.data.value as Record<string, unknown>[]) || []
      for (const p of properties) {
        if (!p['InternetEntireListingDisplayYN']) continue
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data = this.mapProperty(p) as any
        await this.prisma.property.upsert({
          where: { ddfListingKey: data.ddfListingKey },
          create: data,
          update: data,
        })
        syncedListingKeys.push(data.ddfListingKey as string)
        count++
      }

      url = (response.data['@odata.nextLink'] as string) || ''
    }

    this.logger.log(`Synced ${count} properties`)

    // BE-303: push upserted properties to Algolia in batches of 100
    if (syncedListingKeys.length > 0) {
      await this.indexToAlgolia(syncedListingKeys)
    }

    return count
  }

  // ─── Algolia sync (BE-303) ───────────────────────────────────────────────

  /**
   * Fetch upserted properties (with agent + office) from Prisma and push them
   * to the `vicinus_properties` Algolia index.  Processes in chunks of 100 to
   * keep memory usage low.
   */
  private async indexToAlgolia(ddfListingKeys: string[]): Promise<void> {
    const CHUNK = 100
    for (let i = 0; i < ddfListingKeys.length; i += CHUNK) {
      const batch = ddfListingKeys.slice(i, i + CHUNK)
      try {
        const properties = await this.prisma.property.findMany({
          where: { ddfListingKey: { in: batch } },
          include: { agent: true, office: true },
        })
        await this.algolia.indexFromPrisma(properties)
      } catch (err) {
        this.logger.error(`Algolia batch index failed (offset ${i}): ${(err as Error).message}`)
      }
    }
  }

  // ─── DDF → Prisma field mapping ─────────────────────────────────────────

  private mapProperty(p: Record<string, unknown>) {
    const media = (p['Media'] as Record<string, unknown>[]) || []
    return {
      ddfListingKey: String(p['ListingKey']),
      ddfListingId: p['ListingId'] as string | null,
      realtorUrl: (p['ListingURL'] as string) || '',
      status: (p['StandardStatus'] as string) || 'Active',
      displayOnInternet: (p['InternetEntireListingDisplayYN'] as boolean) ?? true,
      price: p['ListPrice'] as number | null,
      leaseAmount: p['LeaseAmount'] as number | null,
      leaseFrequency: p['LeaseAmountFrequency'] as string | null,
      propertySubType: p['PropertySubType'] as string | null,
      beds: p['BedroomsTotal'] as number | null,
      baths: p['BathroomsTotalInteger'] as number | null,
      bathsPartial: p['BathroomsPartial'] as number | null,
      sqft: p['LivingArea'] as number | null,
      lotSize: p['LotSizeArea'] as number | null,
      yearBuilt: p['YearBuilt'] as number | null,
      parkingTotal: p['ParkingTotal'] as number | null,
      stories: p['Stories'] as number | null,
      address: p['UnparsedAddress'] as string | null,
      streetNumber: p['StreetNumber'] as string | null,
      streetName: p['StreetName'] as string | null,
      city: p['City'] as string | null,
      province: p['StateOrProvince'] as string | null,
      postalCode: p['PostalCode'] as string | null,
      country: (p['Country'] as string) || 'Canada',
      lat: p['Latitude'] as number | null,
      lng: p['Longitude'] as number | null,
      description: p['PublicRemarks'] as string | null,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      images: media.map((m) => ({ url: m['MediaURL'], order: m['Order'], isPrimary: m['PreferredPhotoYN'] })) as any,
      photosCount: p['PhotosCount'] as number | null,
      heating: p['Heating'] ?? null,
      cooling: p['Cooling'] ?? null,
      basement: p['Basement'] ?? null,
      parkingFeatures: p['ParkingFeatures'] ?? null,
      exteriorFeatures: p['ExteriorFeatures'] ?? null,
      taxAnnual: p['TaxAnnualAmount'] as number | null,
      taxYear: p['TaxYear'] as number | null,
      ddfAgentKey: p['ListAgentKey'] ? String(p['ListAgentKey']) : null,
      ddfOfficeKey: p['ListOfficeKey'] ? String(p['ListOfficeKey']) : null,
      listedAt: p['OriginalEntryTimestamp'] ? new Date(p['OriginalEntryTimestamp'] as string) : null,
      ddfModifiedAt: p['ModificationTimestamp'] ? new Date(p['ModificationTimestamp'] as string) : null,
      syncedAt: new Date(),
    }
  }
}
