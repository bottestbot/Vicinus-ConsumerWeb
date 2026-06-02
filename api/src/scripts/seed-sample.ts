/**
 * One-shot seed: syncs a bounded slice of DDF data to verify the full pipeline.
 * Office → Member → Property order respects FK constraints.
 * The recurring cron in DdfSyncService handles the full ongoing sync.
 */
import 'reflect-metadata'
import { NestFactory } from '@nestjs/core'
import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { ScheduleModule } from '@nestjs/schedule'
import { HttpModule, HttpService } from '@nestjs/axios'
import { firstValueFrom } from 'rxjs'
import { PrismaModule } from '../prisma/prisma.module'
import { RedisModule } from '../common/redis/redis.module'
import { SearchModule } from '../modules/search/search.module'
import { DdfSyncModule } from '../modules/ddf-sync/ddf-sync.module'
import { DdfAuthService } from '../modules/ddf-sync/ddf-auth.service'
import { PrismaService } from '../prisma/prisma.service'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    PrismaModule,
    RedisModule,
    SearchModule,
    DdfSyncModule,
  ],
})
class SeedModule {}

const MAX_PAGES = { offices: 50, members: 50, properties: 5 }

async function fetchPage(
  http: HttpService,
  token: string,
  url: string,
): Promise<{ value: Record<string, unknown>[]; nextLink: string }> {
  const res = await firstValueFrom(
    http.get(url, { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } }),
  )
  return { value: (res.data.value as Record<string, unknown>[]) || [], nextLink: (res.data['@odata.nextLink'] as string) || '' }
}

async function main() {
  const app = await NestFactory.createApplicationContext(SeedModule, { logger: ['log', 'warn', 'error'] })
  const auth = app.get(DdfAuthService)
  const http = app.get(HttpService)
  const prisma = app.get(PrismaService)
  const config = app.get(ConfigService)
  const base = config.get<string>('DDF_API_BASE_URL')!

  const token = await auth.getToken()

  // ── 1. Offices ─────────────────────────────────────────────────────────────
  console.log('Syncing offices...')
  let url: string = `${base}/Office?$top=100&$orderby=ModificationTimestamp%20asc`
  let offices = 0
  for (let p = 0; p < MAX_PAGES.offices && url; p++) {
    const { value, nextLink } = await fetchPage(http, token, url)
    for (const o of value) {
      const media = (o['Media'] as Record<string, unknown>[]) || []
      const data = {
        ddfOfficeKey: String(o['OfficeKey']),
        name: (o['OfficeName'] as string) || 'Unknown',
        phone: o['OfficePhone'] as string | null,
        address: o['OfficeAddress1'] as string | null,
        city: o['OfficeCity'] as string | null,
        province: o['OfficeStateOrProvince'] as string | null,
        logoUrl: media[0]?.['MediaURL'] as string | null,
        ddfModifiedAt: o['ModificationTimestamp'] ? new Date(o['ModificationTimestamp'] as string) : null,
        syncedAt: new Date(),
      }
      await prisma.office.upsert({ where: { ddfOfficeKey: data.ddfOfficeKey }, create: data, update: data })
      offices++
    }
    url = nextLink
  }
  console.log(`  offices: ${offices}`)

  // ── 2. Members ─────────────────────────────────────────────────────────────
  console.log('Syncing members...')
  url = `${base}/Member?$top=100&$orderby=ModificationTimestamp%20asc`
  let members = 0
  for (let p = 0; p < MAX_PAGES.members && url; p++) {
    const { value, nextLink } = await fetchPage(http, token, url)
    for (const m of value) {
      const media = (m['Media'] as Record<string, unknown>[]) || []
      const data = {
        ddfMemberKey: String(m['MemberKey']),
        fullName: `${m['MemberFirstName'] || ''} ${m['MemberLastName'] || ''}`.trim(),
        jobTitle: m['JobTitle'] as string | null,
        phone: m['MemberOfficePhone'] as string | null,
        emailVisible: (m['MemberEmailYN'] as boolean) ?? false,
        province: m['MemberStateOrProvince'] as string | null,
        avatarUrl: media[0]?.['MediaURL'] as string | null,
        socialMedia: m['MemberSocialMedia'] ?? [],
        ddfOfficeKey: m['OfficeKey'] ? String(m['OfficeKey']) : null,
        ddfModifiedAt: m['ModificationTimestamp'] ? new Date(m['ModificationTimestamp'] as string) : null,
        syncedAt: new Date(),
      }
      try {
        await prisma.agent.upsert({ where: { ddfMemberKey: data.ddfMemberKey }, create: data, update: data })
      } catch (e: unknown) {
        if ((e as { code?: string }).code === 'P2003') {
          await prisma.agent.upsert({
            where: { ddfMemberKey: data.ddfMemberKey },
            create: { ...data, ddfOfficeKey: null },
            update: { ...data, ddfOfficeKey: null },
          })
        } else throw e
      }
      members++
    }
    url = nextLink
  }
  console.log(`  members: ${members}`)

  // ── 3. Properties ──────────────────────────────────────────────────────────
  console.log(`Syncing properties (first ${MAX_PAGES.properties} pages)...`)
  url = `${base}/Property?$top=100&$orderby=ModificationTimestamp%20asc`
  let properties = 0
  for (let p = 0; p < MAX_PAGES.properties && url; p++) {
    const { value, nextLink } = await fetchPage(http, token, url)
    for (const prop of value) {
      if (!prop['InternetEntireListingDisplayYN']) continue
      const media = (prop['Media'] as Record<string, unknown>[]) || []
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data: any = {
        ddfListingKey: String(prop['ListingKey']),
        ddfListingId: prop['ListingId'] as string | null,
        realtorUrl: (prop['ListingURL'] as string) || '',
        status: (prop['StandardStatus'] as string) || 'Active',
        displayOnInternet: (prop['InternetEntireListingDisplayYN'] as boolean) ?? true,
        price: prop['ListPrice'] as number | null,
        leaseAmount: prop['LeaseAmount'] as number | null,
        leaseFrequency: prop['LeaseAmountFrequency'] as string | null,
        propertySubType: prop['PropertySubType'] as string | null,
        beds: prop['BedroomsTotal'] as number | null,
        baths: prop['BathroomsTotalInteger'] as number | null,
        bathsPartial: prop['BathroomsPartial'] as number | null,
        sqft: prop['LivingArea'] as number | null,
        lotSize: prop['LotSizeArea'] as number | null,
        yearBuilt: prop['YearBuilt'] as number | null,
        parkingTotal: prop['ParkingTotal'] as number | null,
        stories: prop['Stories'] as number | null,
        address: prop['UnparsedAddress'] as string | null,
        streetNumber: prop['StreetNumber'] as string | null,
        streetName: prop['StreetName'] as string | null,
        city: prop['City'] as string | null,
        province: prop['StateOrProvince'] as string | null,
        postalCode: prop['PostalCode'] as string | null,
        country: (prop['Country'] as string) || 'Canada',
        lat: prop['Latitude'] as number | null,
        lng: prop['Longitude'] as number | null,
        description: prop['PublicRemarks'] as string | null,
        images: media.map((m) => ({ url: m['MediaURL'], order: m['Order'], isPrimary: m['PreferredPhotoYN'] })),
        photosCount: prop['PhotosCount'] as number | null,
        heating: prop['Heating'] ?? null,
        cooling: prop['Cooling'] ?? null,
        basement: prop['Basement'] ?? null,
        parkingFeatures: prop['ParkingFeatures'] ?? null,
        exteriorFeatures: prop['ExteriorFeatures'] ?? null,
        taxAnnual: prop['TaxAnnualAmount'] as number | null,
        taxYear: prop['TaxYear'] as number | null,
        ddfAgentKey: prop['ListAgentKey'] ? String(prop['ListAgentKey']) : null,
        ddfOfficeKey: prop['ListOfficeKey'] ? String(prop['ListOfficeKey']) : null,
        listedAt: prop['OriginalEntryTimestamp'] ? new Date(prop['OriginalEntryTimestamp'] as string) : null,
        ddfModifiedAt: prop['ModificationTimestamp'] ? new Date(prop['ModificationTimestamp'] as string) : null,
        syncedAt: new Date(),
      }
      try {
        await prisma.property.upsert({ where: { ddfListingKey: data.ddfListingKey }, create: data, update: data })
      } catch (e: unknown) {
        if ((e as { code?: string }).code === 'P2003') {
          await prisma.property.upsert({
            where: { ddfListingKey: data.ddfListingKey },
            create: { ...data, ddfAgentKey: null, ddfOfficeKey: null },
            update: { ...data, ddfAgentKey: null, ddfOfficeKey: null },
          })
        } else throw e
      }
      properties++
    }
    url = nextLink
  }
  console.log(`  properties: ${properties}`)

  await app.close()

  console.log('\n=== Final DB Counts ===')
  const [dbP, dbA, dbO] = await Promise.all([
    prisma.property.count(),
    prisma.agent.count(),
    prisma.office.count(),
  ])
  console.log(`Properties: ${dbP}`)
  console.log(`Agents:     ${dbA}`)
  console.log(`Offices:    ${dbO}`)
}

main().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
