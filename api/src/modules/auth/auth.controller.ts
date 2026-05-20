import { Controller, Post, Body } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { AuthService } from './auth.service'

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  @Post('webhook')
  webhook(@Body() body: unknown) {
    return this.auth.handleWebhook(body as Parameters<AuthService['handleWebhook']>[0])
  }
}
