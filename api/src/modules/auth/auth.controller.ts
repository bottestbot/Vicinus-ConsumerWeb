import { Controller, Post, Body } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  @Post('webhook')
  webhook(@Body() body: unknown) { return { received: true } }
}
