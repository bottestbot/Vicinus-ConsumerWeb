import { Controller, Get, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { ClerkAuthGuard } from '../../common/guards/clerk-auth.guard'

@ApiTags('users')
@Controller('users')
export class UsersController {
  @Get('me')
  @UseGuards(ClerkAuthGuard)
  @ApiBearerAuth()
  getMe() { return { message: 'ok' } }

  @Get('me/saved')
  @UseGuards(ClerkAuthGuard)
  @ApiBearerAuth()
  getSaved() { return [] }

  @Get('me/visited')
  @UseGuards(ClerkAuthGuard)
  @ApiBearerAuth()
  getVisited() { return [] }

  @Get('me/dashboard')
  @UseGuards(ClerkAuthGuard)
  @ApiBearerAuth()
  getDashboard() { return { saved: [], visited: [], editorial: [] } }
}
