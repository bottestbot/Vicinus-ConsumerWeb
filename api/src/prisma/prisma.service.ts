import 'dotenv/config'
import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'

const DATABASE_URL =
  process.env['DATABASE_URL'] ?? 'postgresql://user:password@localhost:5432/vicinus'

function makeAdapter() {
  return new PrismaPg({
    connectionString: DATABASE_URL,
    connectionTimeoutMillis: 3000,
    max: 10,
  })
}

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger(PrismaService.name)

  constructor() {
    super({ adapter: makeAdapter() })
  }

  async onModuleInit() {
    // In Prisma v7 the client engine + driver adapter manages connections lazily
    // via the pg pool — no explicit $connect() needed (and it blocks startup if
    // no database is available in dev).  Connections are established on first query.
    this.logger.log('PrismaService ready (connections established on first query)')
  }
}

// Standalone client for use outside of the NestJS DI context (e.g. scripts, sync jobs)
export const prisma = new PrismaClient({ adapter: makeAdapter() })
