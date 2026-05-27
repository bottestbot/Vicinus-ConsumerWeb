import { Module } from '@nestjs/common'
import { SearchController } from './search.controller'
import { SearchService } from './search.service'
import { AlgoliaService } from './algolia.service'

@Module({
  controllers: [SearchController],
  providers: [SearchService, AlgoliaService],
  /**
   * AlgoliaService is exported so DdfSyncModule can import SearchModule
   * and inject AlgoliaService into DdfPropertySync (BE-303).
   */
  exports: [SearchService, AlgoliaService],
})
export class SearchModule {}
