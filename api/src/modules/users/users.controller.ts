import { Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { ClerkAuthGuard } from '../../common/guards/clerk-auth.guard'
import { CurrentUser } from '../../common/decorators/current-user.decorator'
import { UsersService } from './users.service'

@ApiTags('users')
@Controller('users')
@UseGuards(ClerkAuthGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private users: UsersService) {}

  @Get('me')
  getMe(@CurrentUser() clerkId: string) {
    return this.users.getMe(clerkId)
  }

  @Get('me/saved')
  getSaved(@CurrentUser() clerkId: string) {
    return this.users.getSavedProperties(clerkId)
  }

  @Post('me/saved/:propertyId')
  saveProperty(@CurrentUser() clerkId: string, @Param('propertyId') propertyId: string) {
    return this.users.saveProperty(clerkId, propertyId)
  }

  @Delete('me/saved/:propertyId')
  unsaveProperty(@CurrentUser() clerkId: string, @Param('propertyId') propertyId: string) {
    return this.users.unsaveProperty(clerkId, propertyId)
  }

  @Get('me/visited')
  getVisited(@CurrentUser() clerkId: string) {
    return this.users.getVisitedProperties(clerkId)
  }

  @Post('me/visited/:propertyId')
  trackVisited(@CurrentUser() clerkId: string, @Param('propertyId') propertyId: string) {
    return this.users.trackVisited(clerkId, propertyId)
  }

  @Get('me/dashboard')
  getDashboard(@CurrentUser() clerkId: string) {
    return this.users.getDashboard(clerkId)
  }
}
