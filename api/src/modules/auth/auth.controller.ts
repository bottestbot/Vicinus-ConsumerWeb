import { Controller, Post, Body } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { AuthService } from './auth.service'

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  @Post('webhook')
  @ApiOperation({ summary: 'Clerk webhook — handles user.created / user.updated events' })
  webhook(@Body() body: unknown) {
    return this.auth.handleWebhook(body as Parameters<AuthService['handleWebhook']>[0])
  }
}
