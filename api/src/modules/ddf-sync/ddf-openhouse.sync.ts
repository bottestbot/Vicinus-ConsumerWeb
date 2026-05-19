import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { HttpService } from '@nestjs/axios'
import { firstValueFrom } from 'rxjs'
import { PrismaService } from '../../prisma/prisma.service'
import { DdfAuthService } from './ddf-auth.service'

@Injectable()
export class DdfOpenHouseSync {
  private readonly logger = new Logger(DdfOpenHouseSync.name)

  constructor(
    private auth: DdfAuthService,
    private http: HttpService,
    private prisma: PrismaService,
    private config: ConfigService,
  ) {}

  async sync(): Promise<number> {
    const token = await this.auth.getToken()
    const baseUrl = this.config.get<string>('DDF_API_BASE_URL')
    let url = `${baseUrl}/OpenHouse?$top=100&$filter=OpenHouseStatus eq 'Active'`

    let count = 0
    while (url) {
      const response = await firstValueFrom(
        this.http.get(url, { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } }),
      )
      for (const oh of (response.data.value as Record<string, unknown>[]) || []) {
        const data = {
          ddfOpenHouseKey: String(oh['OpenHouseKey']),
          ddfListingKey: oh['ListingKey'] ? String(oh['ListingKey']) : null,
          openHouseDate: oh['OpenHouseDate'] ? new Date(oh['OpenHouseDate'] as string) : null,
          startTime: oh['OpenHouseStartTime'] as string | null,
          endTime: oh['OpenHouseEndTime'] as string | null,
          openHouseType: oh['OpenHouseType'] as string | null,
          status: oh['OpenHouseStatus'] as string | null,
          remarks: oh['OpenHouseRemarks'] as string | null,
        }
        await this.prisma.openHouse.upsert({
          where: { ddfOpenHouseKey: data.ddfOpenHouseKey },
          create: data,
          update: { openHouseDate: data.openHouseDate, startTime: data.startTime, endTime: data.endTime, status: data.status },
        })
        count++
      }
      url = (response.data['@odata.nextLink'] as string) || ''
    }
    this.logger.log(`Synced ${count} open houses`)
    return count
  }
}
