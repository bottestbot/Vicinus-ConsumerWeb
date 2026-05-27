import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import Redis from 'ioredis'

/**
 * Thin wrapper around ioredis with graceful degradation:
 * - If REDIS_URL is absent or the connection fails, all operations become no-ops /
 *   return null — the app continues to serve uncached responses.
 * - Errors are logged at WARN level; they never bubble up as exceptions.
 */
@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: Redis | null = null
  private readonly logger = new Logger(RedisService.name)

  constructor(private config: ConfigService) {}

  onModuleInit() {
    const url = this.config.get<string>('REDIS_URL')
    if (!url) {
      this.logger.warn('REDIS_URL not configured — Redis cache disabled')
      return
    }

    try {
      this.client = new Redis(url, {
        lazyConnect: true,
        maxRetriesPerRequest: 1,
        enableOfflineQueue: false,
        connectTimeout: 5_000,
      })

      this.client.on('error', (err: Error) => {
        this.logger.warn(`Redis error (cache degraded): ${err.message}`)
      })

      this.client.connect().catch((err: Error) => {
        this.logger.warn(`Redis connect failed (cache disabled): ${err.message}`)
        this.client = null
      })
    } catch (err) {
      this.logger.warn(`Redis init error (cache disabled): ${String(err)}`)
      this.client = null
    }
  }

  async onModuleDestroy() {
    if (this.client) {
      try {
        await this.client.quit()
      } catch {
        // Ignore quit errors during shutdown
      }
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.client) return null
    try {
      const raw = await this.client.get(key)
      return raw ? (JSON.parse(raw) as T) : null
    } catch {
      return null
    }
  }

  async set(key: string, value: unknown, ttlSeconds: number): Promise<void> {
    if (!this.client) return
    try {
      await this.client.set(key, JSON.stringify(value), 'EX', ttlSeconds)
    } catch {
      // Silently degrade — don't crash on cache write failures
    }
  }

  async del(...keys: string[]): Promise<void> {
    if (!this.client || !keys.length) return
    try {
      await this.client.del(...keys)
    } catch {
      // Silently degrade
    }
  }
}
