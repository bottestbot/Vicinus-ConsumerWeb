import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ClerkAuthGuard } from '../../common/guards/clerk-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { OpenHouseVisitsService } from './open-house-visits.service';
import { UpdateOpenHouseVisitDto } from './dto/update-open-house-visit.dto';

@ApiTags('users')
@Controller('users')
@UseGuards(ClerkAuthGuard)
@ApiBearerAuth()
export class OpenHouseVisitsController {
  constructor(private visits: OpenHouseVisitsService) {}

  @Get('me/open-house-visits')
  @ApiOperation({ summary: 'List scheduled open houses, grouped by date' })
  list(@CurrentUser() clerkId: string) {
    return this.visits.listForUser(clerkId);
  }

  @Post('me/open-house-visits/:key')
  @ApiOperation({ summary: 'Add an open house to the schedule' })
  add(@CurrentUser() clerkId: string, @Param('key') key: string) {
    return this.visits.addToSchedule(clerkId, key);
  }

  @Patch('me/open-house-visits/:key')
  @ApiOperation({
    summary: 'Update a scheduled open house status (planned/attended/skipped)',
  })
  update(
    @CurrentUser() clerkId: string,
    @Param('key') key: string,
    @Body() dto: UpdateOpenHouseVisitDto,
  ) {
    return this.visits.updateStatus(clerkId, key, dto.status);
  }

  @Delete('me/open-house-visits/:key')
  @ApiOperation({ summary: 'Remove an open house from the schedule' })
  remove(@CurrentUser() clerkId: string, @Param('key') key: string) {
    return this.visits.removeFromSchedule(clerkId, key);
  }
}
