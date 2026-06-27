import { Module } from '@nestjs/common'
import { SearchModule } from '../search/search.module'
import { AiController } from './ai.controller'
import { AiService } from './ai.service'

@Module({
  imports: [SearchModule],
  controllers: [AiController],
  providers: [AiService],
})
export class AiModule {}
