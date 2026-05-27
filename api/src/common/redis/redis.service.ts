import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import Redis from 'ioredis'

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name)
  private client!: Redis
  private connected = false

  constructor(private config: ConfigService) {}

  async onModuleInit() {
    const url = this.config.get<string>('REDIS_URL') || 'redis://localhost:6379'
    this.client = new Redis(url, {
      lazyConnect: true,
      retryStrategy: (times) => (times > 3 ? null : Math.min(times * 200, 3000)),
      maxRetriesPerRequest: 2,
    })

    this.client.on('error', (err: Error) => {
      if (this.connected) this.logger.warn(`Redis error: ${err.message}`)
      this.connected = false
    })

    this.client.on('connect', () => {
      this.connected = true
    })

    try {
      await this.client.connect()
      this.connected = true
      this.logger.log('Redis connected')
    } catch {
      this.connected = false
      this.logger.warn('Redis unavailable — search caching disabled')
    }
  }

  async onModuleDestroy() {
    try {
      await this.client.quit()
    } catch {
      // best-effort cleanup
    }
  }

  async get(key: string): Promise<string | null> {
    if (!this.connected) return null
    try {
      return await this.client.get(key)
    } catch {
      return null
    }
  }

  async set(key: string, value: string, ttlSeconds: number): Promise<void> {
    if (!this.connected) return
    try {
      await this.client.set(key, value, 'EX', ttlSeconds)
    } catch {
      // best-effort — cache miss is acceptable
    }
  }

  async del(key: string): Promise<void> {
    if (!this.connected) return
    try {
      await this.client.del(key)
    } catch {
      // best-effort
    }
  }

  async delPattern(pattern: string): Promise<void> {
    if (!this.connected) return
    try {
      const keys = await this.client.keys(pattern)
      if (keys.length > 0) await this.client.del(...keys)
    } catch {
      // best-effort
    }
  }
}
