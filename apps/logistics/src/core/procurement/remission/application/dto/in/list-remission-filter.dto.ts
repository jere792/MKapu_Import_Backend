import { Type } from 'class-transformer';
import { IsOptional, IsNumber, IsString } from 'class-validator';

export class ListRemissionFilterDto {
  @IsOptional() @IsNumber() @Type(() => Number) page?: number = 1;
  @IsOptional() @IsNumber() @Type(() => Number) limit?: number = 10;
  @IsOptional() @IsString() search?: string;

  @IsOptional() @IsNumber() @Type(() => Number) estado?: number;
  @IsOptional() @IsString() startDate?: string;
  @IsOptional() @IsString() endDate?: string;
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  id_sede?: number;
}
