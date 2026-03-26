import { IsOptional, IsNumber, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class ListRemissionFilterDto {
  @IsOptional() @IsNumber() @Type(() => Number) page?: number = 1;
  @IsOptional() @IsNumber() @Type(() => Number) limit?: number = 10;
  @IsOptional() @IsString() search?: string;

  @IsOptional()
  @IsString()
  estado?: string;

  @IsOptional() @IsString() startDate?: string;
  @IsOptional() @IsString() endDate?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  id_sede?: number;
}
