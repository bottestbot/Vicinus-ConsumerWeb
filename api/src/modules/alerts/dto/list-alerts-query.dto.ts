import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { AlertType } from '@prisma/client';

export class ListAlertsQueryDto {
  /** Accepts either a single type (`type=NEW_LISTING`) or a CSV list
   *  (`type=NEW_LISTING,PRICE_DROP`) — the Alerts tab needs "everything but
   *  OPEN_HOUSE" in one server-side query rather than filtering client-side
   *  against whatever page happens to be loaded. */
  @ApiPropertyOptional({ enum: AlertType, isArray: true })
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.split(',').map((v) => v.trim()) : value,
  )
  @IsEnum(AlertType, { each: true })
  type?: AlertType | AlertType[];

  @ApiPropertyOptional({ type: Number, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ type: Number, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
