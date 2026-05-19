import { Module } from '@nestjs/common'
import { EditorialService } from './editorial.service'

@Module({ providers: [EditorialService] })
export class EditorialModule {}
