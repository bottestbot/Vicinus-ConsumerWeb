import {
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ClerkAuthGuard } from '../../common/guards/clerk-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AlertsService } from './alerts.service';
import { ListAlertsQueryDto } from './dto/list-alerts-query.dto';

@ApiTags('users')
@Controller('users')
@UseGuards(ClerkAuthGuard)
@ApiBearerAuth()
export class AlertsController {
  constructor(private alerts: AlertsService) {}

  @Get('me/alerts')
  @ApiOperation({
    summary: 'List alerts, paginated, optionally filtered by type',
  })
  listAlerts(
    @CurrentUser() clerkId: string,
    @Query() query: ListAlertsQueryDto,
  ) {
    return this.alerts.listForUser(clerkId, query);
  }

  // Declared before the `:id` route so it can never be shadowed by it.
  @Patch('me/alerts/read-all')
  @ApiOperation({ summary: 'Mark all alerts as read' })
  markAllRead(@CurrentUser() clerkId: string) {
    return this.alerts.markAllRead(clerkId);
  }

  @Patch('me/alerts/:id')
  @ApiOperation({ summary: 'Mark a single alert as read' })
  markRead(@CurrentUser() clerkId: string, @Param('id') id: string) {
    return this.alerts.markRead(clerkId, id);
  }

  @Delete('me/alerts/:id')
  @ApiOperation({ summary: 'Delete a single alert' })
  delete(@CurrentUser() clerkId: string, @Param('id') id: string) {
    return this.alerts.delete(clerkId, id);
  }
}
