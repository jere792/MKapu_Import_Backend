import { Transform } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class ListTransferQueryDto {
  @Transform(({ value }) => String(value ?? '').trim())
  @IsString()
  @IsNotEmpty()
  headquartersId: string;

  @IsOptional()
  @Transform(({ value }) => parseInt(String(value), 10) || 1)
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Transform(({ value }) => parseInt(String(value), 10) || 20)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize: number = 20;
}
