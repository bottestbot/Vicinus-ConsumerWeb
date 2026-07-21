import { NestFactory } from '@nestjs/core'
import { NestExpressApplication } from '@nestjs/platform-express'
import { AppModule } from './app.module'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { ValidationPipe } from '@nestjs/common'
import cookieParser from 'cookie-parser'

// TODO (production): add `helmet` package for HTTP security headers
// import helmet from 'helmet'

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule)

  // CREA-01: we sit behind Railway's proxy, so req.ip / req.ips must be derived
  // from X-Forwarded-For rather than the socket address — otherwise every
  // request looks like it comes from the proxy and per-IP throttling is
  // meaningless. Trust exactly one hop: trusting all of them would let a client
  // spoof its own address by injecting extra X-Forwarded-For entries.
  app.set('trust proxy', 1)

  // CREA-02: the analytics endpoint reads its visitor id from a signed
  // HttpOnly cookie rather than the request body, so the caller cannot choose
  // (or rotate) the identity reported to CREA.
  app.use(cookieParser(process.env.COOKIE_SECRET || 'vicinus-dev-cookie-secret'))

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
