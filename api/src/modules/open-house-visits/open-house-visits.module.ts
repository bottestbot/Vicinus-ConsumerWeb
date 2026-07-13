import { Module } from '@nestjs/common';
import { OpenHouseVisitsController } from './open-house-visits.controller';
import { OpenHouseVisitsService } from './open-house-visits.service';
import { UsersModule } from '../users/users.module';
import { SearchModule } from '../search/search.module';

@Module({
  // SearchModule exports DdfQueryService, used for the live-DDF fallback when
  // scheduling an open house that hasn't synced locally yet.
  imports: [UsersModule, SearchModule],
  controllers: [OpenHouseVisitsController],
  providers: [OpenHouseVisitsService],
})
export class OpenHouseVisitsModule {}
