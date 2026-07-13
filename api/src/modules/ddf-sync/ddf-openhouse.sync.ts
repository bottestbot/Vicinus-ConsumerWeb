import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { PrismaService } from '../../prisma/prisma.service';
import { DdfAuthService } from './ddf-auth.service';
import { AlertsService } from '../alerts/alerts.service';

@Injectable()
export class DdfOpenHouseSync {
  private readonly logger = new Logger(DdfOpenHouseSync.name);

  constructor(
    private auth: DdfAuthService,
    private http: HttpService,
    private prisma: PrismaService,
    private config: ConfigService,
    private alerts: AlertsService,
  ) {}

  async sync(): Promise<number> {
    const token = await this.auth.getToken();
    const baseUrl = this.config.get<string>('DDF_API_BASE_URL');
    let url = `${baseUrl}/OpenHouse?$top=100&$filter=OpenHouseStatus eq 'Active'`;

    let count = 0;
    while (url) {
      const response = await firstValueFrom(
        this.http.get(url, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
        }),
      );
      for (const oh of (response.data.value as Record<string, unknown>[]) ||
        []) {
        const data = {
          ddfOpenHouseKey: String(oh['OpenHouseKey']),
          ddfListingKey: oh['ListingKey'] ? String(oh['ListingKey']) : null,
          openHouseDate: oh['OpenHouseDate']
            ? new Date(oh['OpenHouseDate'] as string)
            : null,
          startTime: oh['OpenHouseStartTime'] as string | null,
          endTime: oh['OpenHouseEndTime'] as string | null,
          openHouseType: oh['OpenHouseType'] as string | null,
          status: oh['OpenHouseStatus'] as string | null,
          remarks: oh['OpenHouseRemarks'] as string | null,
        };
        let upserted;
        try {
          upserted = await this.prisma.openHouse.upsert({
            where: { ddfOpenHouseKey: data.ddfOpenHouseKey },
            create: data,
            update: {
              openHouseDate: data.openHouseDate,
              startTime: data.startTime,
              endTime: data.endTime,
              status: data.status,
            },
          });
        } catch (err: unknown) {
          // The live OpenHouse feed often references listings that haven't
          // synced into the local Property table yet (Property sync runs
          // first each cron tick, but is a separate paginated call and can
          // lag behind, especially given the intermittent DDF connection
          // errors seen in DdfSyncLog). Skip rather than write a permanently
          // unlinked row — this record gets retried on the next sync once
          // its Property has synced, matching users' saved/search alerts.
          if ((err as { code?: string }).code === 'P2003') {
            this.logger.warn(
              `Skipped open house ${data.ddfOpenHouseKey} — listing ${data.ddfListingKey} not yet synced`,
            );
            continue;
          }
          throw err;
        }

        // BE-803: dedup is enforced by Alert's unique constraint, so this can
        // safely run unconditionally on every sync without a pre-upsert diff.
        try {
          await this.alerts.generateOpenHouseAlerts(upserted);
        } catch (err) {
          this.logger.error(
            `Alert generation failed for open house ${upserted.ddfOpenHouseKey}`,
            err,
          );
        }
        count++;
      }
      url = (response.data['@odata.nextLink'] as string) || '';
    }
    this.logger.log(`Synced ${count} open houses`);
    return count;
  }
}
