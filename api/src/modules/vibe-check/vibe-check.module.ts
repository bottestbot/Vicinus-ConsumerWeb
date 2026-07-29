import { Module } from '@nestjs/common'
import { VibeCheckController } from './vibe-check.controller'
import { VibeCheckService } from './vibe-check.service'

@Module({
  controllers: [VibeCheckController],
  providers: [VibeCheckService],
})
export class VibeCheckModule {}
