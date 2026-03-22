import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

export class ListCustomerFilterDto {
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true'  || value === true  || value === 1) return true;
    if (value === 'false' || value === false || value === 0) return false;
    return undefined;
  })
  @IsBoolean()
  status?: boolean;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  documentTypeId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number;

  @IsOptional()
  @IsString()
  tipo?: string;
}