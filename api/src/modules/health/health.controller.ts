import { Controller, Get } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { DdfQueryService } from '../ddf-sync/ddf-query.service'

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly ddf: DdfQueryService) {}

  // GET /health — cheap liveness probe with NO DB/DDF/Redis work, so it's safe
  // for a frequent keep-warm ping and for Railway's deploy healthcheck. Deep
  // dependency checks (Postgres/Redis) are deferred to DATA-21's /health/deep.
  @Get()
  @ApiOperation({ summary: 'Liveness probe (no dependencies)' })
  check() {
    return {
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    }
  }

  // GET /health/ddf — active probe of the live DDF Property query. Exists because
  // a CREA schema change (StandardStatus becoming non-filterable, 2026-07) returned
  // HTTP 400 that searchProperties swallowed into an empty result, so the whole
  // site showed "no listings" with nothing alerting. This surfaces that class of
  // failure. Deliberately NOT wired into the Railway healthcheck (`/health`): a DDF
  // outage must not restart the API. Point an uptime monitor here, alert on
  // `status != "ok"`.
  @Get('ddf')
  @ApiOperation({ summary: 'Active DDF Property-query probe (not a liveness gate)' })
  async ddfProbe() {
    const result = await this.ddf.probe()
    return {
      status: result.ok ? 'ok' : 'degraded',
      ddf: result,
      timestamp: new Date().toISOString(),
    }
  }
}
