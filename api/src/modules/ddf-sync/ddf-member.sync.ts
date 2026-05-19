import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { HttpService } from '@nestjs/axios'
import { firstValueFrom } from 'rxjs'
import { PrismaService } from '../../prisma/prisma.service'
import { DdfAuthService } from './ddf-auth.service'

@Injectable()
export class DdfMemberSync {
  private readonly logger = new Logger(DdfMemberSync.name)

  constructor(
    private auth: DdfAuthService,
    private http: HttpService,
    private prisma: PrismaService,
    private config: ConfigService,
  ) {}

  async sync(since?: Date): Promise<number> {
    const token = await this.auth.getToken()
    const baseUrl = this.config.get<string>('DDF_API_BASE_URL')
    let url = `${baseUrl}/Member?$top=100&$orderby=ModificationTimestamp asc`
    if (since) url += `&$filter=ModificationTimestamp gt ${since.toISOString()}`

    let count = 0
    while (url) {
      const response = await firstValueFrom(
        this.http.get(url, { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } }),
      )
      for (const m of (response.data.value as Record<string, unknown>[]) || []) {
        const data = this.mapMember(m)
        await this.prisma.agent.upsert({ where: { ddfMemberKey: data.ddfMemberKey }, create: data, update: data })
        count++
      }
      url = (response.data['@odata.nextLink'] as string) || ''
    }
    this.logger.log(`Synced ${count} members`)
    return count
  }

  private mapMember(m: Record<string, unknown>) {
    const media = (m['Media'] as Record<string, unknown>[]) || []
    return {
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
  }
}
