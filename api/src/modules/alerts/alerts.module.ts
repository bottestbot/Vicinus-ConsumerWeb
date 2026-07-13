import { Module } from '@nestjs/common';
import { AlertsController } from './alerts.controller';
import { AlertsService } from './alerts.service';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [UsersModule],
  controllers: [AlertsController],
  providers: [AlertsService],
  // Consumed by DdfSyncModule (ddf-property.sync.ts / ddf-openhouse.sync.ts) to
  // generate alerts right after a property/open-house upsert.
  exports: [AlertsService],
})
export class AlertsModule {}
