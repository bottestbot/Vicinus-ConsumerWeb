import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { ValidationPipe } from '@nestjs/common'

// TODO (production): add `helmet` package for HTTP security headers
// import helmet from 'helmet'

// TODO (production): add `@nestjs/throttler` for rate limiting
// ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]) in AppModule,
// then app.useGlobalGuards(new ThrottlerGuard(...)) here

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  // ── Security: CORS (restrict origin in production via FRONTEND_URL env var) ──
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  })

  // TODO (production): app.use(helmet()) after installing the `helmet` package

  app.useGlobalPipes(new ValidationPipe({ transform: true }))

  const config = new DocumentBuilder()
    .setTitle('Vicinus API')
    .setDescription('Vicinus real estate platform REST API')
    .setVersion('1.0')
    .addBearerAuth()
    .build()
  SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, config))

  await app.listen(process.env.PORT || 3001)
}
bootstrap()
