import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { UsersController } from './users.controller'
import { UsersService } from './users.service'
import { EditorialModule } from '../editorial/editorial.module'

@Module({
  imports: [EditorialModule, ConfigModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
