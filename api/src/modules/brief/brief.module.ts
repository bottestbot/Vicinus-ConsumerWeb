import { Module } from '@nestjs/common'
import { UsersModule } from '../users/users.module'
import { BriefController } from './brief.controller'
import { BriefService } from './brief.service'
import { BriefFactsService } from './brief-facts.service'
import { BriefCopyService } from './brief-copy.service'

// BRIEF-06 — PrismaService, RedisService and ConfigService are all provided by
// @Global modules; only UsersService needs an explicit import.
@Module({
  imports: [UsersModule],
  controllers: [BriefController],
  providers: [BriefService, BriefFactsService, BriefCopyService],
})
export class BriefModule {}
