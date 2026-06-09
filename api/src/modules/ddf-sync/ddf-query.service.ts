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
      filterParts.push(`tolower(City) eq '${this.sanitize(dto.city.toLowerCase())}'`)
    }
    if (dto.province) {
      filterParts.push(`tolower(StateOrProvince) eq '${this.sanitize(dto.province.toLowerCase())}'`)
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
      const q = this.sanitize(dto.q.toLowerCase())
      filterParts.push(
        `(contains(tolower(UnparsedAddress),'${q}') or contains(tolower(City),'${q}') or contains(PostalCode,'${this.sanitize(dto.q)}'))`,
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
}
