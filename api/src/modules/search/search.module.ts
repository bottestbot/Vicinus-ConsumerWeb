import { Module } from '@nestjs/common'
import { HttpModule } from '@nestjs/axios'
import { SearchController } from './search.controller'
import { SearchService } from './search.service'
import { AlgoliaService } from './algolia.service'
import { DdfAuthService } from '../ddf-sync/ddf-auth.service'
import { DdfQueryService } from '../ddf-sync/ddf-query.service'

@Module({
  imports: [HttpModule],
  controllers: [SearchController],
  providers: [SearchService, AlgoliaService, DdfAuthService, DdfQueryService],
  /**
   * AlgoliaService is exported so DdfSyncModule can import SearchModule and
   * inject AlgoliaService into DdfPropertySync (BE-303).
   * SearchService is exported for any future inter-module consumers.
   */
  exports: [SearchService, AlgoliaService, DdfQueryService],
})
export class SearchModule {}
