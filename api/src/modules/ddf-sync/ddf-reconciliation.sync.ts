import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { HttpService } from '@nestjs/axios'
import { firstValueFrom } from 'rxjs'
import { PrismaService } from '../../prisma/prisma.service'
import { RedisService } from '../../common/redis/redis.service'
import { DdfAuthService } from './ddf-auth.service'

export interface ReconciliationResult {
  masterCount: number
  deletedCount: number
}

/**
 * DDF replication reconciliation (Task #1).
 *
 * The incremental Property sync ({@link DdfPropertySync}) is upsert-only and
 * never removes listings. CREA DDF rules require that any local listing which
 * is NOT present in the authoritative `PropertyReplication()` master list
 * (i.e. sold / cancelled / expired / off-market) be deleted so the site never
 * advertises stale inventory. This service reconciles the local `Property`
 * table against that master list on a daily cron.
 *
 * NOTE on "search index" cleanup: this app has no Algolia/local search index —
 * search, feed and detail all read live from the DDF API on demand. The only
 * derived copy of a listing is the Redis detail cache, which we purge for every
 * deleted key so a sold listing can't be served from cache.
 */
@Injectable()
export class DdfReconciliationSync {
  private readonly logger = new Logger(DdfReconciliationSync.name)

  constructor(
    private readonly auth: DdfAuthService,
    private readonly http: HttpService,
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly redis: RedisService,
  ) {}

  /**
   * Fetch the full master-list of live ListingKeys from PropertyReplication()
   * (paginated) and delete any local Property whose ddfListingKey is absent.
   */
  async reconcile(): Promise<ReconciliationResult> {
    const masterKeys = await this.fetchMasterListingKeys()

    // Guard: an empty master list almost certainly means the replication call
    // failed or returned nothing — never wipe the whole table on that basis.
    if (masterKeys.size === 0) {
      this.logger.warn('PropertyReplication returned 0 keys — skipping deletion')
      return { masterCount: 0, deletedCount: 0 }
    }

    // Diff local keys against the master list in the DB (id + key only).
    const local = await this.prisma.property.findMany({
      select: { id: true, ddfListingKey: true },
    })
    const stale = local.filter((p) => !masterKeys.has(p.ddfListingKey))

    if (stale.length === 0) {
      this.logger.log(`Reconciliation: ${masterKeys.size} live, 0 stale`)
      return { masterCount: masterKeys.size, deletedCount: 0 }
    }

    const staleIds = stale.map((p) => p.id)
    const staleKeys = stale.map((p) => p.ddfListingKey)

    const { count } = await this.prisma.property.deleteMany({
      where: { id: { in: staleIds } },
    })

    // Purge any cached detail payloads for the deleted listings (the closest
    // equivalent to removing them from a search index in this live-DDF setup).
    await Promise.all(
      staleKeys.map((key) => this.redis.del(`listing:${key}`).catch(() => undefined)),
    ).catch(() => undefined)

    this.logger.log(
      `Reconciliation: ${masterKeys.size} live, deleted ${count} stale listings`,
    )
    return { masterCount: masterKeys.size, deletedCount: count }
  }

  /**
   * Page through `Property/PropertyReplication()` collecting every ListingKey
   * in the master list. Scoped to the configured DestinationId when set.
   */
  private async fetchMasterListingKeys(): Promise<Set<string>> {
    const baseUrl = this.config.get<string>('DDF_API_BASE_URL')
    const destinationId = this.config.get<string>('DDF_DESTINATION_ID')

    const keys = new Set<string>()
    let url = destinationId
      ? `${baseUrl}/Property/PropertyReplication(DestinationId=${destinationId})`
      : `${baseUrl}/Property/PropertyReplication()`

    while (url) {
      const token = await this.auth.getToken()
      const response = await firstValueFrom(
        this.http.get(url, {
          headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
        }),
      )

      const rows = (response.data.value as Record<string, unknown>[]) || []
      for (const r of rows) {
        const key = r['ListingKey']
        if (key !== undefined && key !== null) keys.add(String(key))
      }

      url = (response.data['@odata.nextLink'] as string) || ''
    }

    return keys
  }
}
