import { Module } from '@nestjs/common'
import { HttpModule } from '@nestjs/axios'
import { SearchController } from './search.controller'
import { SearchService } from './search.service'
import { DdfAuthService } from '../ddf-sync/ddf-auth.service'
import { DdfQueryService } from '../ddf-sync/ddf-query.service'

@Module({
  imports: [HttpModule],
  controllers: [SearchController],
  providers: [SearchService, DdfAuthService, DdfQueryService],
  exports: [SearchService, DdfQueryService],
})
export class SearchModule {}
