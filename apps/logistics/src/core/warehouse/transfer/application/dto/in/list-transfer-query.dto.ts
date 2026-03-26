import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

const normalizeOptionalDate = ({ value }: { value: unknown }): string | undefined => {
  const normalized = String(value ?? '').trim();
  return normalized || undefined;
};

const normalizeOptionalBoolean = ({ value }: { value: unknown }): boolean | undefined => {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  if (typeof value === 'boolean') {
    return value;
  }

  const normalized = String(value).trim().toLowerCase();
  if (normalized === 'true') {
    return true;
  }

  if (normalized === 'false') {
    return false;
  }

  return undefined;
};

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

  @IsOptional()
  @Transform(normalizeOptionalDate)
  @IsDateString()
  dateFrom?: string;

  @IsOptional()
  @Transform(normalizeOptionalDate)
  @IsDateString()
  dateTo?: string;

  @IsOptional()
  @Transform(normalizeOptionalBoolean)
  @IsBoolean()
  ignoreDateRange?: boolean;
}
