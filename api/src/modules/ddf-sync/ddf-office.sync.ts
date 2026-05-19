import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { HttpService } from '@nestjs/axios'
import { firstValueFrom } from 'rxjs'
import { PrismaService } from '../../prisma/prisma.service'
import { DdfAuthService } from './ddf-auth.service'

@Injectable()
export class DdfOfficeSync {
  private readonly logger = new Logger(DdfOfficeSync.name)

  constructor(
    private auth: DdfAuthService,
    private http: HttpService,
    private prisma: PrismaService,
    private config: ConfigService,
  ) {}

  async sync(since?: Date): Promise<number> {
    const token = await this.auth.getToken()
    const baseUrl = this.config.get<string>('DDF_API_BASE_URL')
    let url = `${baseUrl}/Office?$top=100&$orderby=ModificationTimestamp asc`
    if (since) url += `&$filter=ModificationTimestamp gt ${since.toISOString()}`

    let count = 0
    while (url) {
      const response = await firstValueFrom(
        this.http.get(url, { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } }),
      )
      for (const o of (response.data.value as Record<string, unknown>[]) || []) {
        const data = this.mapOffice(o)
        await this.prisma.office.upsert({ where: { ddfOfficeKey: data.ddfOfficeKey }, create: data, update: data })
        count++
      }
      url = (response.data['@odata.nextLink'] as string) || ''
    }
    this.logger.log(`Synced ${count} offices`)
    return count
  }

  private mapOffice(o: Record<string, unknown>) {
    const media = (o['Media'] as Record<string, unknown>[]) || []
    return {
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
  }
}
