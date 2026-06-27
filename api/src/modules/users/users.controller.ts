import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { ClerkAuthGuard } from '../../common/guards/clerk-auth.guard'
import { CurrentUser } from '../../common/decorators/current-user.decorator'
import { UsersService } from './users.service'
import { CreateSavedSearchDto } from '../search/dto/create-saved-search.dto'

@ApiTags('users')
@Controller('users')
@UseGuards(ClerkAuthGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private users: UsersService) {}

  // ─── Profile ─────────────────────────────────────────────────────────────

  @Get('me')
  @ApiOperation({ summary: 'Return the current user profile' })
  getMe(@CurrentUser() clerkId: string) {
    return this.users.getMe(clerkId)
  }

  // ─── Saved Properties ────────────────────────────────────────────────────

  @Get('me/saved')
  @ApiOperation({ summary: 'List saved properties' })
  getSaved(@CurrentUser() clerkId: string) {
    return this.users.getSavedProperties(clerkId)
  }

  @Post('me/saved/:propertyId')
  @ApiOperation({ summary: 'Save a property' })
  saveProperty(@CurrentUser() clerkId: string, @Param('propertyId') propertyId: string) {
    return this.users.saveProperty(clerkId, propertyId)
  }

  @Delete('me/saved/:propertyId')
  @ApiOperation({ summary: 'Remove a saved property' })
  unsaveProperty(@CurrentUser() clerkId: string, @Param('propertyId') propertyId: string) {
    return this.users.unsaveProperty(clerkId, propertyId)
  }

  // ─── Visited Properties ──────────────────────────────────────────────────

  @Get('me/visited')
  @ApiOperation({ summary: 'List recently visited properties (last 20)' })
  getVisited(@CurrentUser() clerkId: string) {
    return this.users.getVisitedProperties(clerkId)
  }

  @Post('me/visited/:propertyId')
  @ApiOperation({ summary: 'Track a property visit' })
  trackVisited(@CurrentUser() clerkId: string, @Param('propertyId') propertyId: string) {
    return this.users.trackVisited(clerkId, propertyId)
  }

  // ─── Saved Searches (BE-306) ─────────────────────────────────────────────

  @Get('me/searches')
  @ApiOperation({ summary: 'List saved searches' })
  getSavedSearches(@CurrentUser() clerkId: string) {
    return this.users.getSavedSearches(clerkId)
  }

  @Post('me/searches')
  @ApiOperation({ summary: 'Save a search (name + serialised filters)' })
  createSavedSearch(@CurrentUser() clerkId: string, @Body() dto: CreateSavedSearchDto) {
    return this.users.createSavedSearch(clerkId, dto)
  }

  @Delete('me/searches/:id')
  @ApiOperation({ summary: 'Delete a saved search' })
  deleteSavedSearch(@CurrentUser() clerkId: string, @Param('id') id: string) {
    return this.users.deleteSavedSearch(clerkId, id)
  }

  // ─── Onboarding ──────────────────────────────────────────────────────────

  @Post('me/ping')
  @ApiOperation({ summary: 'Record a login and return whether to show onboarding' })
  ping(@CurrentUser() clerkId: string) {
    return this.users.ping(clerkId)
  }

  @Patch('me/onboarding')
  @ApiOperation({ summary: 'Save onboarding step data or mark as completed' })
  updateOnboarding(
    @CurrentUser() clerkId: string,
    @Body() body: { stepData?: Record<string, unknown>; completed?: boolean },
  ) {
    return this.users.updateOnboarding(clerkId, body)
  }

  // ─── Dashboard ───────────────────────────────────────────────────────────

  @Get('me/dashboard')
  @ApiOperation({ summary: 'Aggregated dashboard data (saved, visited, editorial)' })
  getDashboard(@CurrentUser() clerkId: string) {
    return this.users.getDashboard(clerkId)
  }
}
