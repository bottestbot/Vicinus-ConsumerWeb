import { Module } from '@nestjs/common'
import { HttpModule } from '@nestjs/axios'
import { MortgageController } from './mortgage.controller'
import { MortgageService } from './mortgage.service'
import { AirtableMortgageService } from './airtable-mortgage.service'

@Module({
  imports: [HttpModule],
  controllers: [MortgageController],
  providers: [MortgageService, AirtableMortgageService],
})
export class MortgageModule {}
