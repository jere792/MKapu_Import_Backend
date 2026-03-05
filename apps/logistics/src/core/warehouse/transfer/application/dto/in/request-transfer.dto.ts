import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export class RequestTransferItemDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  productId: number;

  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  series?: string[];

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity?: number;
}

export class RequestTransferDto {
  @IsString()
  @IsNotEmpty()
  originHeadquartersId: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  originWarehouseId: number;

  @IsString()
  @IsNotEmpty()
  destinationHeadquartersId: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  destinationWarehouseId: number;

  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => RequestTransferItemDto)
  items: RequestTransferItemDto[];

  @IsOptional()
  @IsString()
  observation?: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  userId: number;

  @IsOptional()
  @IsString()
  transferMode?: string;
}
