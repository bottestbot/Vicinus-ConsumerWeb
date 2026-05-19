import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { HttpService } from '@nestjs/axios'
import { firstValueFrom } from 'rxjs'

@Injectable()
export class DdfAuthService {
  private readonly logger = new Logger(DdfAuthService.name)
  private token: string | null = null
  private expiresAt: Date | null = null

  constructor(
    private config: ConfigService,
    private http: HttpService,
  ) {}

  async getToken(): Promise<string> {
    if (this.token && this.expiresAt && this.expiresAt > new Date(Date.now() + 60_000)) {
      return this.token
    }
    return this.refreshToken()
  }

  private async refreshToken(): Promise<string> {
    const params = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: this.config.get<string>('DDF_CLIENT_ID') ?? '',
      client_secret: this.config.get<string>('DDF_CLIENT_SECRET') ?? '',
      scope: 'DDFApi_Read',
    })

    const response = await firstValueFrom(
      this.http.post(this.config.get<string>('DDF_AUTH_URL') ?? '', params.toString(), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      }),
    )

    this.token = response.data.access_token as string
    this.expiresAt = new Date(Date.now() + (response.data.expires_in as number) * 1000)
    this.logger.log('DDF OAuth token refreshed')
    return this.token
  }
}
