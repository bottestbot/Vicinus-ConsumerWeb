import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { OpenHouseStatus } from '@prisma/client';

export class UpdateOpenHouseVisitDto {
  @ApiProperty({ enum: OpenHouseStatus })
  @IsEnum(OpenHouseStatus)
  status: OpenHouseStatus;
}
