import { Controller, Get } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'

@ApiTags('health')
@Controller('health')
export class HealthController {
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
}
