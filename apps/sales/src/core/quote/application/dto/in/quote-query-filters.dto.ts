import { Type, Transform } from 'class-transformer';
import { IsOptional, IsString, IsNumber, IsEnum } from 'class-validator';

export class QuoteQueryFiltersDto {
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  estado?: string;

  @IsOptional()
  @IsEnum(['VENTA', 'COMPRA'])
  tipo?: 'VENTA' | 'COMPRA';

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  search?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  page?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  limit?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  id_sede?: number;
}