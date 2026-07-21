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
  /** Rows that *would* have been deleted (equals deletedCount unless skipped). */
  staleCount: number
  /** Set when the run refused to delete: 'dry-run' | 'empty-master' | 'ceiling'. */
  skippedReason?: 'dry-run' | 'empty-master' | 'ceiling'
}

/**
 * Refuse to delete when more than this share of the local table is considered
 * stale. Normal daily churn is low single-digit percent; anything approaching
 * this is far more likely to be a truncated master list than genuine expiry.
 */
const MAX_DELETE_RATIO = 0.3

/** CREA-07c: size of the last successfully-fetched master list. */
const LAST_MASTER_COUNT_KEY = 'ddf:reconcile:last-master-count'
/** Long enough to span several missed runs, short enough to expire if abandoned. */
const LAST_MASTER_COUNT_TTL_SECONDS = 30 * 24 * 60 * 60

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
      return { masterCount: 0, deletedCount: 0, staleCount: 0, skippedReason: 'empty-master' }
    }

    // Diff local keys against the master list in the DB (id + key only).
    const local = await this.prisma.property.findMany({
      select: { id: true, ddfListingKey: true },
    })
    const stale = local.filter((p) => !masterKeys.has(p.ddfListingKey))

    if (stale.length === 0) {
      this.logger.log(`Reconciliation: ${masterKeys.size} live, 0 stale`)
      return { masterCount: masterKeys.size, deletedCount: 0, staleCount: 0 }
    }

    // CREA-07a. The empty-master guard above only catches *total* failure. A
    // truncated paging run (a broken @odata.nextLink chain that still parses)
    // yields a short-but-nonzero master list, and every listing missing from
    // it looks stale. Refuse implausibly large deletions and ask for a human.
    const ratio = stale.length / local.length
    if (ratio > MAX_DELETE_RATIO) {
      this.logger.error(
        `Reconciliation would delete ${stale.length}/${local.length} listings ` +
          `(${Math.round(ratio * 100)}%, ceiling ${Math.round(MAX_DELETE_RATIO * 100)}%) — ` +
          `aborting. Master list likely truncated; verify PropertyReplication paging.`,
      )
      return {
        masterCount: masterKeys.size,
        deletedCount: 0,
        staleCount: stale.length,
        skippedReason: 'ceiling',
      }
    }

    const staleIds = stale.map((p) => p.id)
    const staleKeys = stale.map((p) => p.ddfListingKey)

    // CREA-07b. Defaults to dry-run: this cron deletes production rows and must
    // prove itself in logs before it is trusted to act. Set
    // DDF_RECONCILE_DRY_RUN=false to arm it.
    if (this.config.get<string>('DDF_RECONCILE_DRY_RUN') !== 'false') {
      this.logger.warn(
        `Reconciliation DRY RUN: would delete ${stale.length}/${local.length} ` +
          `listings (${masterKeys.size} live). Set DDF_RECONCILE_DRY_RUN=false to arm. ` +
          `Keys: ${staleKeys.slice(0, 20).join(', ')}${stale.length > 20 ? ` …+${stale.length - 20} more` : ''}`,
      )
      return {
        masterCount: masterKeys.size,
        deletedCount: 0,
        staleCount: stale.length,
        skippedReason: 'dry-run',
      }
    }

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
    return { masterCount: masterKeys.size, deletedCount: count, staleCount: stale.length }
  }

  /**
   * Page through `Property/PropertyReplication()` collecting every ListingKey
   * in the master list. Scoped to the configured DestinationId when set.
   *
   * CREA-07c: a silently short master list is the dangerous failure — every
   * listing missing from it looks stale and would be deleted. So each page is
   * retried before giving up, and a partial walk throws rather than returning
   * what it managed to collect.
   */
  private async fetchMasterListingKeys(): Promise<Set<string>> {
    const baseUrl = this.config.get<string>('DDF_API_BASE_URL')
    const destinationId = this.config.get<string>('DDF_DESTINATION_ID')

    const keys = new Set<string>()
    let url = destinationId
      ? `${baseUrl}/Property/PropertyReplication(DestinationId=${destinationId})`
      : `${baseUrl}/Property/PropertyReplication()`

    let declaredTotal: number | undefined
    let pages = 0

    while (url) {
      const response = await this.fetchPageWithRetry(url)
      pages += 1

      // CREA-07c: OData may declare the full count up front. When it does it is
      // the most direct completeness check available.
      const count = response['@odata.count']
      if (declaredTotal === undefined && typeof count === 'number') declaredTotal = count

      const rows = (response.value as Record<string, unknown>[]) || []
      for (const r of rows) {
        const key = r['ListingKey']
        if (key !== undefined && key !== null) keys.add(String(key))
      }

      url = (response['@odata.nextLink'] as string) || ''
    }

    // CREA-07c: if CREA told us how many rows to expect, insist on having them.
    if (declaredTotal !== undefined && keys.size < declaredTotal) {
      throw new Error(
        `PropertyReplication truncated: collected ${keys.size} of ${declaredTotal} ` +
          `declared keys over ${pages} page(s) — refusing to reconcile against a partial list`,
      )
    }

    // CREA-07c: otherwise compare against the last observed master size. A list
    // that suddenly loses a large share of its rows is far more likely to be a
    // broken paging walk than genuine mass expiry. Kept in Redis rather than a
    // new DdfSyncLog column so this needs no migration; if the key is evicted
    // the check simply no-ops and the ratio ceiling (CREA-07a) still applies.
    const previousCount = Number(
      (await this.redis.get(LAST_MASTER_COUNT_KEY).catch(() => null)) ?? 0,
    )
    if (previousCount > 0 && keys.size < previousCount * (1 - MAX_DELETE_RATIO)) {
      throw new Error(
        `PropertyReplication returned ${keys.size} keys vs ${previousCount} on the ` +
          `previous run — refusing to reconcile against a likely-truncated list`,
      )
    }

    await this.redis
      .set(LAST_MASTER_COUNT_KEY, String(keys.size), LAST_MASTER_COUNT_TTL_SECONDS)
      .catch(() => undefined)

    return keys
  }

  /**
   * One page of the master list, retried on transient failure. A page that
   * cannot be fetched must abort the whole walk (CREA-07c) — silently skipping
   * it would shorten the master list and mark real listings as stale.
   */
  private async fetchPageWithRetry(
    url: string,
    attempts = 3,
  ): Promise<Record<string, unknown>> {
    let lastError: unknown

    for (let attempt = 1; attempt <= attempts; attempt++) {
      try {
        const token = await this.auth.getToken()
        const response = await firstValueFrom(
          this.http.get(url, {
            headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
          }),
        )
        return response.data as Record<string, unknown>
      } catch (err) {
        lastError = err
        if (attempt < attempts) {
          const backoffMs = 1_000 * 2 ** (attempt - 1)
          this.logger.warn(
            `PropertyReplication page failed (attempt ${attempt}/${attempts}), ` +
              `retrying in ${backoffMs}ms: ${(err as Error).message}`,
          )
          await new Promise((resolve) => setTimeout(resolve, backoffMs))
        }
      }
    }

    throw new Error(
      `PropertyReplication page failed after ${attempts} attempts: ${(lastError as Error)?.message}`,
    )
  }
}
