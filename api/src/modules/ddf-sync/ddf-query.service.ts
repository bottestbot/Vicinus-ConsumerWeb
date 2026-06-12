import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { HttpService } from '@nestjs/axios'
import { firstValueFrom } from 'rxjs'
import { DdfAuthService } from './ddf-auth.service'
import { SearchQueryDto } from '../search/dto/search-query.dto'

export interface MapPin {
  id: string
  lat: number | null
  lng: number | null
  price: number | null
}

export interface SearchResult {
  data: unknown[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface OpenHouseSlot {
  id: string
  listingKey: string
  date: string | null
  startTime: string | null
  endTime: string | null
  type: string | null
  remarks: string | null
  livestreamUrl: string | null
}

/** A nearby listing that has an upcoming open house. Matches the FE `OpenHouseProperty` type. */
export interface NearbyOpenHouse {
  id: string
  address: string
  city: string
  province: string
  price: number | null
  beds: number | null
  baths: number | null
  sqft: number | null
  imageUrl: string
  openHouseDate: string
  openHouseStartTime: string | null
  openHouseEndTime: string | null
  agentName: string
  brokerageName: string
}

@Injectable()
export class DdfQueryService {
  private readonly logger = new Logger(DdfQueryService.name)

  constructor(
    private auth: DdfAuthService,
    private http: HttpService,
    private config: ConfigService,
  ) {}

  async searchProperties(dto: SearchQueryDto, skip: number, limit: number): Promise<SearchResult> {
    const baseUrl = this.config.get<string>('DDF_API_BASE_URL')

    const filterParts: string[] = ['InternetEntireListingDisplayYN eq true']
    filterParts.push(`StandardStatus eq '${this.sanitize(dto.status ?? 'Active')}'`)

    if (dto.city) {
      // DDF OData does not support tolower() — match on canonical (title) case
      filterParts.push(`City eq '${this.sanitize(this.toTitleCase(dto.city))}'`)
    }
    if (dto.province) {
      // DDF stores the full province name in title case ("Ontario"), so map
      // 2-letter codes to names and title-case anything else
      filterParts.push(
        `StateOrProvince eq '${this.sanitize(this.normalizeProvince(dto.province))}'`,
      )
    }
    if (dto.minPrice !== undefined) filterParts.push(`ListPrice ge ${dto.minPrice}`)
    if (dto.maxPrice !== undefined) filterParts.push(`ListPrice le ${dto.maxPrice}`)
    if (dto.beds !== undefined) filterParts.push(`BedroomsTotal ge ${dto.beds}`)
    if (dto.baths !== undefined) filterParts.push(`BathroomsTotalInteger ge ${dto.baths}`)
    if (dto.minSqft !== undefined) filterParts.push(`LivingArea ge ${dto.minSqft}`)
    if (dto.maxSqft !== undefined) filterParts.push(`LivingArea le ${dto.maxSqft}`)
    if (dto.yearBuiltMin !== undefined) filterParts.push(`YearBuilt ge ${dto.yearBuiltMin}`)
    if (dto.parkingMin !== undefined) filterParts.push(`ParkingTotal ge ${dto.parkingMin}`)

    if (dto.propertyType) {
      const types = dto.propertyType
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)
      if (types.length === 1) {
        filterParts.push(`PropertySubType eq '${this.sanitize(types[0])}'`)
      } else if (types.length > 1) {
        const typeFilter = types.map((t) => `PropertySubType eq '${this.sanitize(t)}'`).join(' or ')
        filterParts.push(`(${typeFilter})`)
      }
    }

    if (dto.bbox) {
      const coords = this.parseBbox(dto.bbox)
      if (coords) {
        const { west, south, east, north } = coords
        filterParts.push(
          `Latitude ge ${south} and Latitude le ${north} and Longitude ge ${west} and Longitude le ${east}`,
        )
      }
    }

    if (dto.q) {
      // DDF OData does not support tolower() — search with title-cased value
      // (matches how addresses/cities are stored) plus raw postal-code match
      const q = this.sanitize(this.toTitleCase(dto.q))
      const postal = this.sanitize(dto.q.toUpperCase())
      filterParts.push(
        `(contains(UnparsedAddress,'${q}') or contains(City,'${q}') or contains(PostalCode,'${postal}'))`,
      )
    }

    const filter = filterParts.join(' and ')
    const url =
      `${baseUrl}/Property` +
      `?$top=${limit}` +
      `&$skip=${skip}` +
      `&$filter=${encodeURIComponent(filter)}` +
      `&$orderby=ModificationTimestamp%20desc` +
      `&$count=true`

    try {
      const token = await this.auth.getToken()
      const response = await firstValueFrom(
        this.http.get(url, {
          headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
        }),
      )

      const properties = (response.data.value as Record<string, unknown>[]) ?? []
      const total = (response.data['@odata.count'] as number | undefined) ?? properties.length
      const page = dto.page ?? 1
      const data = properties.map((p) => this.mapProperty(p))

      return { data, total, page, limit, totalPages: Math.ceil(total / limit) }
    } catch (err) {
      const body = (err as { response?: { data?: unknown } }).response?.data
      this.logger.error(`DDF search failed: ${(err as Error).message}${body ? ` — ${JSON.stringify(body)}` : ''}`)
      return { data: [], total: 0, page: dto.page ?? 1, limit, totalPages: 0 }
    }
  }

  async getMapPins(bbox: string): Promise<MapPin[]> {
    const coords = this.parseBbox(bbox)
    if (!coords) return []

    const { west, south, east, north } = coords
    const baseUrl = this.config.get<string>('DDF_API_BASE_URL')

    const filter =
      `InternetEntireListingDisplayYN eq true` +
      ` and StandardStatus eq 'Active'` +
      ` and Latitude ge ${south} and Latitude le ${north}` +
      ` and Longitude ge ${west} and Longitude le ${east}`

    const url =
      `${baseUrl}/Property` +
      `?$top=500` +
      `&$filter=${encodeURIComponent(filter)}` +
      `&$select=ListingKey,Latitude,Longitude,ListPrice`

    try {
      const token = await this.auth.getToken()
      const response = await firstValueFrom(
        this.http.get(url, {
          headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
        }),
      )

      const properties = (response.data.value as Record<string, unknown>[]) ?? []
      return properties.map((p) => ({
        id: String(p['ListingKey']),
        lat: (p['Latitude'] as number | null) ?? null,
        lng: (p['Longitude'] as number | null) ?? null,
        price: (p['ListPrice'] as number | null) ?? null,
      }))
    } catch (err) {
      const body = (err as { response?: { data?: unknown } }).response?.data
      this.logger.error(`DDF map-pins failed: ${(err as Error).message}${body ? ` — ${JSON.stringify(body)}` : ''}`)
      return []
    }
  }

  /**
   * Fetch a single live listing by its DDF ListingKey, with full detail fields
   * and media. Returns the same mapped shape as search results, or null if the
   * listing is not found / no longer available on DDF.
   */
  async getListingByKey(listingKey: string): Promise<Record<string, unknown> | null> {
    const baseUrl = this.config.get<string>('DDF_API_BASE_URL')
    const key = this.sanitize(listingKey)
    // Media is returned inline on this DDF feed — $expand=Media is rejected
    const url =
      `${baseUrl}/Property` +
      `?$filter=${encodeURIComponent(`ListingKey eq '${key}'`)}` +
      `&$top=1`

    try {
      const token = await this.auth.getToken()
      const response = await firstValueFrom(
        this.http.get(url, {
          headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
        }),
      )
      const rows = (response.data.value as Record<string, unknown>[]) ?? []
      if (rows.length === 0) return null
      return this.mapPropertyDetail(rows[0])
    } catch (err) {
      const body = (err as { response?: { data?: unknown } }).response?.data
      this.logger.error(
        `DDF listing fetch failed for ${listingKey}: ${(err as Error).message}${body ? ` — ${JSON.stringify(body)}` : ''}`,
      )
      return null
    }
  }

  /**
   * Upcoming open houses for a single listing, fetched live from the DDF
   * OpenHouse resource and joined by ListingKey. Returns only Active, future
   * dated slots, sorted soonest-first.
   */
  async getOpenHousesByKey(listingKey: string): Promise<OpenHouseSlot[]> {
    const baseUrl = this.config.get<string>('DDF_API_BASE_URL')
    const key = this.sanitize(listingKey)
    const url =
      `${baseUrl}/OpenHouse` +
      `?$filter=${encodeURIComponent(`ListingKey eq '${key}' and OpenHouseStatus eq 'Active'`)}` +
      `&$top=25`

    try {
      const token = await this.auth.getToken()
      const response = await firstValueFrom(
        this.http.get(url, {
          headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
        }),
      )
      const rows = (response.data.value as Record<string, unknown>[]) ?? []
      const todayStr = new Date().toISOString().slice(0, 10)

      return rows
        .map((oh) => ({
          id: String(oh['OpenHouseKey']),
          listingKey: String(oh['ListingKey']),
          date: (oh['OpenHouseDate'] as string | null) ?? null,
          startTime: (oh['OpenHouseStartTime'] as string | null) ?? null,
          endTime: (oh['OpenHouseEndTime'] as string | null) ?? null,
          type: (oh['OpenHouseType'] as string | null) ?? null,
          remarks: (oh['OpenHouseRemarks'] as string | null) ?? null,
          livestreamUrl: (oh['LivestreamOpenHouseURL'] as string | null) ?? null,
        }))
        .filter((oh) => oh.date !== null && oh.date >= todayStr)
        .sort((a, b) => (a.date ?? '').localeCompare(b.date ?? '') || (a.startTime ?? '').localeCompare(b.startTime ?? ''))
    } catch (err) {
      const body = (err as { response?: { data?: unknown } }).response?.data
      this.logger.error(
        `DDF open-house fetch failed for ${listingKey}: ${(err as Error).message}${body ? ` — ${JSON.stringify(body)}` : ''}`,
      )
      return []
    }
  }

  private mapProperty(p: Record<string, unknown>): Record<string, unknown> {
    const media = (p['Media'] as Record<string, unknown>[]) ?? []
    return {
      id: String(p['ListingKey']),
      ddfListingKey: String(p['ListingKey']),
      ddfListingId: (p['ListingId'] as string | null) ?? null,
      realtorUrl: (p['ListingURL'] as string) ?? '',
      status: (p['StandardStatus'] as string) ?? 'Active',
      price: (p['ListPrice'] as number | null) ?? null,
      leaseAmount: (p['LeaseAmount'] as number | null) ?? null,
      leaseFrequency: (p['LeaseAmountFrequency'] as string | null) ?? null,
      propertySubType: (p['PropertySubType'] as string | null) ?? null,
      beds: (p['BedroomsTotal'] as number | null) ?? null,
      baths: (p['BathroomsTotalInteger'] as number | null) ?? null,
      bathsPartial: (p['BathroomsPartial'] as number | null) ?? null,
      sqft: (p['LivingArea'] as number | null) ?? null,
      lotSize: (p['LotSizeArea'] as number | null) ?? null,
      yearBuilt: (p['YearBuilt'] as number | null) ?? null,
      parkingTotal: (p['ParkingTotal'] as number | null) ?? null,
      stories: (p['Stories'] as number | null) ?? null,
      address: (p['UnparsedAddress'] as string | null) ?? null,
      streetNumber: (p['StreetNumber'] as string | null) ?? null,
      streetName: (p['StreetName'] as string | null) ?? null,
      city: (p['City'] as string | null) ?? null,
      province: (p['StateOrProvince'] as string | null) ?? null,
      postalCode: (p['PostalCode'] as string | null) ?? null,
      country: (p['Country'] as string) ?? 'Canada',
      lat: (p['Latitude'] as number | null) ?? null,
      lng: (p['Longitude'] as number | null) ?? null,
      description: (p['PublicRemarks'] as string | null) ?? null,
      images: media.map((m) => ({ url: m['MediaURL'], order: m['Order'], isPrimary: m['PreferredPhotoYN'] })),
      photosCount: (p['PhotosCount'] as number | null) ?? null,
      taxAnnual: (p['TaxAnnualAmount'] as number | null) ?? null,
      taxYear: (p['TaxYear'] as number | null) ?? null,
      listedAt: p['OriginalEntryTimestamp'] ? new Date(p['OriginalEntryTimestamp'] as string) : null,
      agent: p['ListAgentFullName'] ? { fullName: String(p['ListAgentFullName']) } : null,
      office: p['ListOfficeName'] ? { name: String(p['ListOfficeName']) } : null,
    }
  }

  /**
   * Rich detail mapper for the single-listing detail page. Returns everything
   * `mapProperty` returns (top-level keys unchanged for backward-compat) PLUS an
   * additive nested `details` object. Kept separate from `mapProperty` so the
   * list/search payloads stay lean.
   */
  private mapPropertyDetail(p: Record<string, unknown>): Record<string, unknown> {
    const base = this.mapProperty(p)

    const num = (k: string): number | null => (p[k] as number | null) ?? null
    const str = (k: string): string | null => (p[k] as string | null) ?? null
    const bool = (k: string): boolean | null => (p[k] as boolean | null) ?? null
    const arr = (k: string): string[] => ((p[k] as string[] | null) ?? []).filter((v) => v != null)

    const listPrice = (p['ListPrice'] as number | null) ?? null
    const livingArea = (p['LivingArea'] as number | null) ?? null
    const pricePerSqft =
      listPrice !== null && listPrice > 0 && livingArea !== null && livingArea > 0
        ? Math.round(listPrice / livingArea)
        : null

    const bathsTotal = (p['BathroomsTotalInteger'] as number | null) ?? 0
    const bathsPartial = (p['BathroomsPartial'] as number | null) ?? 0
    const bathsFull = Math.max(0, bathsTotal - bathsPartial)

    const rawRooms = (p['Rooms'] as Record<string, unknown>[] | null) ?? []
    const rooms = rawRooms.map((r) => ({
      type: (r['RoomType'] as string | null) ?? null,
      level: (r['RoomLevel'] as string | null) ?? null,
      dimensions: (r['RoomDimensions'] as string | null) ?? null,
    }))

    return {
      ...base,
      details: {
        interior: {
          appliances: arr('Appliances'),
          rooms,
          bedroomsAboveGrade: num('BedroomsAboveGrade'),
          bedroomsBelowGrade: num('BedroomsBelowGrade'),
          bathsTotal: num('BathroomsTotalInteger'),
          bathsFull,
          bathsPartial: num('BathroomsPartial'),
          heating: arr('Heating'),
          cooling: arr('Cooling'),
          flooring: arr('Flooring'),
          basement: arr('Basement'),
          fireplacesTotal: num('FireplacesTotal'),
          fireplaceYN: bool('FireplaceYN'),
          fireplaceFeatures: arr('FireplaceFeatures'),
          aboveGradeFinishedArea: num('AboveGradeFinishedArea'),
          belowGradeFinishedArea: num('BelowGradeFinishedArea'),
          securityFeatures: arr('SecurityFeatures'),
        },
        exterior: {
          parkingTotal: num('ParkingTotal'),
          parkingFeatures: arr('ParkingFeatures'),
          lotSizeArea: num('LotSizeArea'),
          lotSizeUnits: str('LotSizeUnits'),
          lotSizeDimensions: str('LotSizeDimensions'),
          frontageLength: num('FrontageLengthNumeric'),
          frontageUnits: str('FrontageLengthNumericUnits'),
          lotFeatures: arr('LotFeatures'),
          poolFeatures: arr('PoolFeatures'),
          view: arr('View'),
          viewYN: bool('ViewYN'),
          exteriorFeatures: arr('ExteriorFeatures'),
          constructionMaterials: arr('ConstructionMaterials'),
          architecturalStyle: arr('ArchitecturalStyle'),
          structureType: arr('StructureType'),
          fencing: arr('Fencing'),
          sewer: arr('Sewer'),
          waterSource: arr('WaterSource'),
          zoning: str('Zoning'),
          zoningDescription: str('ZoningDescription'),
          yearBuilt: num('YearBuilt'),
          stories: num('Stories'),
        },
        finance: {
          price: listPrice,
          pricePerSqft,
          taxAnnualAmount: num('TaxAnnualAmount'),
          taxYear: num('TaxYear'),
          listedAt: str('OriginalEntryTimestamp'),
          commonInterest: str('CommonInterest'),
          subdivisionName: str('SubdivisionName'),
          associationFee: num('AssociationFee'),
          associationFeeFrequency: str('AssociationFeeFrequency'),
          associationFeeIncludes: arr('AssociationFeeIncludes'),
          propertySubType: str('PropertySubType'),
        },
      },
    }
  }

  /**
   * Nearby listings that have an upcoming open house, for the detail page.
   *
   * OData NOTES (verified live against the DDF feed):
   *  - The feed ACCEPTS the `in` operator on both Property and OpenHouse
   *    (`ListingKey in ('k1','k2')` → HTTP 200), so we use `in` for the batched
   *    ListingKey filter rather than OR-joined `eq`.
   *  - `$top` is HARD-CAPPED at 100: `$top` > 100 → HTTP 400 (silently turned
   *    into [] by our try/catch). All requests below use `$top=100`.
   */
  async getNearbyOpenHousesByKey(listingKey: string): Promise<NearbyOpenHouse[]> {
    const NEARBY_DELTA = 0.05 // ~5km
    const WIDE_DELTA = 0.1 // ~10km fallback
    const MAX_CANDIDATES = 100
    const MAX_RESULTS = 12
    const BATCH_SIZE = 40
    const MAX_CONCURRENT_BATCHES = 3

    const baseUrl = this.config.get<string>('DDF_API_BASE_URL')
    const subjectKey = this.sanitize(listingKey)

    try {
      // 1. Subject lat/lng (lightweight)
      const subjUrl =
        `${baseUrl}/Property` +
        `?$filter=${encodeURIComponent(`ListingKey eq '${subjectKey}'`)}` +
        `&$select=ListingKey,Latitude,Longitude&$top=1`
      const token = await this.auth.getToken()
      const subjResp = await firstValueFrom(
        this.http.get(subjUrl, {
          headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
        }),
      )
      const subj = ((subjResp.data.value as Record<string, unknown>[]) ?? [])[0]
      const lat = (subj?.['Latitude'] as number | null) ?? null
      const lng = (subj?.['Longitude'] as number | null) ?? null
      if (lat === null || lng === null) return []

      // 2-4. Candidate keys within bbox, widening once if empty
      const fetchCandidates = async (delta: number): Promise<string[]> => {
        const south = lat - delta
        const north = lat + delta
        const west = lng - delta
        const east = lng + delta
        const filter =
          `InternetEntireListingDisplayYN eq true` +
          ` and StandardStatus eq 'Active'` +
          ` and Latitude ge ${south} and Latitude le ${north}` +
          ` and Longitude ge ${west} and Longitude le ${east}` +
          ` and ListingKey ne '${subjectKey}'`
        const url =
          `${baseUrl}/Property` +
          `?$filter=${encodeURIComponent(filter)}` +
          `&$select=ListingKey&$top=100`
        const t = await this.auth.getToken()
        const resp = await firstValueFrom(
          this.http.get(url, {
            headers: { Authorization: `Bearer ${t}`, Accept: 'application/json' },
          }),
        )
        const rows = (resp.data.value as Record<string, unknown>[]) ?? []
        return rows
          .map((r) => String(r['ListingKey']))
          .filter((k) => k !== listingKey)
      }

      let candidates = await fetchCandidates(NEARBY_DELTA)
      if (candidates.length === 0) candidates = await fetchCandidates(WIDE_DELTA)
      candidates = candidates.slice(0, MAX_CANDIDATES)
      if (candidates.length === 0) return []

      // 5. OpenHouse join — batch candidate keys, bounded concurrency
      const todayStr = new Date().toISOString().slice(0, 10)
      const batches: string[][] = []
      for (let i = 0; i < candidates.length; i += BATCH_SIZE) {
        batches.push(candidates.slice(i, i + BATCH_SIZE))
      }

      // soonest upcoming slot per ListingKey
      const soonest = new Map<
        string,
        { date: string; startTime: string | null; endTime: string | null }
      >()

      const runBatch = async (keys: string[]): Promise<void> => {
        const keyList = keys.map((k) => `'${this.sanitize(k)}'`).join(',')
        const filter = `OpenHouseStatus eq 'Active' and ListingKey in (${keyList})`
        const url =
          `${baseUrl}/OpenHouse` +
          `?$filter=${encodeURIComponent(filter)}&$top=100`
        try {
          const t = await this.auth.getToken()
          const resp = await firstValueFrom(
            this.http.get(url, {
              headers: { Authorization: `Bearer ${t}`, Accept: 'application/json' },
            }),
          )
          const rows = (resp.data.value as Record<string, unknown>[]) ?? []
          for (const oh of rows) {
            const k = String(oh['ListingKey'])
            const date = (oh['OpenHouseDate'] as string | null) ?? null
            if (date === null || date < todayStr) continue
            const startTime = (oh['OpenHouseStartTime'] as string | null) ?? null
            const endTime = (oh['OpenHouseEndTime'] as string | null) ?? null
            const existing = soonest.get(k)
            if (
              !existing ||
              date < existing.date ||
              (date === existing.date && (startTime ?? '') < (existing.startTime ?? ''))
            ) {
              soonest.set(k, { date, startTime, endTime })
            }
          }
        } catch (err) {
          const body = (err as { response?: { data?: unknown } }).response?.data
          this.logger.error(
            `DDF nearby open-house batch failed: ${(err as Error).message}${body ? ` — ${JSON.stringify(body)}` : ''}`,
          )
          // swallow — partial results
        }
      }

      for (let i = 0; i < batches.length; i += MAX_CONCURRENT_BATCHES) {
        const slice = batches.slice(i, i + MAX_CONCURRENT_BATCHES)
        await Promise.all(slice.map((b) => runBatch(b)))
      }

      const keysWithOH = [...soonest.keys()]
      if (keysWithOH.length === 0) return []

      // 6. Hydrate cards — single Property query for keys with OHs
      const hydrateKeys = keysWithOH.slice(0, BATCH_SIZE * MAX_CONCURRENT_BATCHES)
      const hydrateMap = new Map<string, Record<string, unknown>>()
      const hydrateBatches: string[][] = []
      for (let i = 0; i < hydrateKeys.length; i += BATCH_SIZE) {
        hydrateBatches.push(hydrateKeys.slice(i, i + BATCH_SIZE))
      }
      const hydrateBatch = async (keys: string[]): Promise<void> => {
        const keyList = keys.map((k) => `'${this.sanitize(k)}'`).join(',')
        const filter = `ListingKey in (${keyList})`
        // NOTE: `ListAgentFullName` / `ListOfficeName` are NOT $select-able on the
        // DDF Property entity (verified: `$select=...,ListAgentFullName` → HTTP 400,
        // "Could not find a property named 'ListAgentFullName'"), even though they
        // ARE present on the full (un-$select-ed) record. Since keysWithOH is small
        // (≤12), we fetch full records here rather than risk a 400 from $select.
        const url =
          `${baseUrl}/Property` +
          `?$filter=${encodeURIComponent(filter)}` +
          `&$top=100`
        try {
          const t = await this.auth.getToken()
          const resp = await firstValueFrom(
            this.http.get(url, {
              headers: { Authorization: `Bearer ${t}`, Accept: 'application/json' },
            }),
          )
          const rows = (resp.data.value as Record<string, unknown>[]) ?? []
          for (const r of rows) hydrateMap.set(String(r['ListingKey']), r)
        } catch (err) {
          const body = (err as { response?: { data?: unknown } }).response?.data
          this.logger.error(
            `DDF nearby hydrate batch failed: ${(err as Error).message}${body ? ` — ${JSON.stringify(body)}` : ''}`,
          )
        }
      }
      for (let i = 0; i < hydrateBatches.length; i += MAX_CONCURRENT_BATCHES) {
        const slice = hydrateBatches.slice(i, i + MAX_CONCURRENT_BATCHES)
        await Promise.all(slice.map((b) => hydrateBatch(b)))
      }

      // 7. Map to card shape, sort by openHouseDate asc, cap
      const cards: NearbyOpenHouse[] = []
      for (const [k, oh] of soonest) {
        const p = hydrateMap.get(k)
        if (!p) continue
        const media = (p['Media'] as Record<string, unknown>[]) ?? []
        const primary = media.find((m) => m['PreferredPhotoYN'] === true) ?? media[0]
        const imageUrl = (primary?.['MediaURL'] as string | null) ?? ''
        cards.push({
          id: k,
          address: (p['UnparsedAddress'] as string | null) ?? '',
          city: (p['City'] as string | null) ?? '',
          province: (p['StateOrProvince'] as string | null) ?? '',
          price: (p['ListPrice'] as number | null) ?? null,
          beds: (p['BedroomsTotal'] as number | null) ?? null,
          baths: (p['BathroomsTotalInteger'] as number | null) ?? null,
          sqft: (p['LivingArea'] as number | null) ?? null,
          imageUrl,
          openHouseDate: oh.date,
          openHouseStartTime: oh.startTime,
          openHouseEndTime: oh.endTime,
          agentName: (p['ListAgentFullName'] as string | null) ?? '',
          brokerageName: (p['ListOfficeName'] as string | null) ?? '',
        })
      }

      cards.sort(
        (a, b) =>
          a.openHouseDate.localeCompare(b.openHouseDate) ||
          (a.openHouseStartTime ?? '').localeCompare(b.openHouseStartTime ?? ''),
      )
      return cards.slice(0, MAX_RESULTS)
    } catch (err) {
      const body = (err as { response?: { data?: unknown } }).response?.data
      this.logger.error(
        `DDF nearby open-houses failed for ${listingKey}: ${(err as Error).message}${body ? ` — ${JSON.stringify(body)}` : ''}`,
      )
      return []
    }
  }

  private parseBbox(bbox: string): { west: number; south: number; east: number; north: number } | null {
    const parts = bbox.split(',').map(Number)
    if (parts.length !== 4 || parts.some(isNaN)) {
      this.logger.warn(`Invalid bbox: "${bbox}"`)
      return null
    }
    const [west, south, east, north] = parts
    return { west, south, east, north }
  }

  /** Escape single quotes to prevent OData filter injection. */
  private sanitize(value: string): string {
    return value.replace(/'/g, "''")
  }

  /**
   * Title-case a value to match CREA DDF's canonical casing.
   * DDF's OData endpoint does not support tolower(), so we must send
   * city/address values in the case the data is stored (title case).
   */
  private toTitleCase(value: string): string {
    return value
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase())
  }

  /** Map a province code or name to DDF's canonical full title-case name. */
  private normalizeProvince(value: string): string {
    const codes: Record<string, string> = {
      AB: 'Alberta',
      BC: 'British Columbia',
      MB: 'Manitoba',
      NB: 'New Brunswick',
      NL: 'Newfoundland and Labrador',
      NS: 'Nova Scotia',
      NT: 'Northwest Territories',
      NU: 'Nunavut',
      ON: 'Ontario',
      PE: 'Prince Edward Island',
      QC: 'Quebec',
      SK: 'Saskatchewan',
      YT: 'Yukon',
    }
    const trimmed = value.trim()
    return codes[trimmed.toUpperCase()] ?? this.toTitleCase(trimmed)
  }
}
