import { Type } from 'class-transformer';
import { IsOptional, IsBoolean, IsInt, Min, Max } from 'class-validator';

export class ListWarehousesFilterDto {
  @IsOptional()
  search?: string;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  activo?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(1000)
  @Type(() => Number)         
  pageSize?: number;
}