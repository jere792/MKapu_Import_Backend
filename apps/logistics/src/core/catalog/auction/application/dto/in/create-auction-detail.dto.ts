// application/dto/in/create-auction-detail.dto.ts
import { Type } from 'class-transformer';
import { IsInt, IsPositive, IsNumber, Min, IsOptional } from 'class-validator';

export class CreateAuctionDetailDto {
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  id_producto!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  pre_original!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  pre_remate!: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  stock_remate!: number;

  @IsOptional()
  observacion?: string;
}