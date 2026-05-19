import { Module } from '@nestjs/common'
import { NeighbourhoodsController } from './neighbourhoods.controller'
import { NeighbourhoodsService } from './neighbourhoods.service'

@Module({ controllers: [NeighbourhoodsController], providers: [NeighbourhoodsService] })
export class NeighbourhoodsModule {}
