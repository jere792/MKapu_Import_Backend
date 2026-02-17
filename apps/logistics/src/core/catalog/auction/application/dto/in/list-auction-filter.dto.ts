// application/dto/in/list-auction-filter.dto.ts
import { Type } from 'class-transformer';
import { IsOptional, IsInt, Min, IsString, IsEnum, IsDateString } from 'class-validator';
import { AuctionStatus } from './create-auction.dto';

export class ListAuctionFilterDto {
  @IsOptional()
  @IsString()
  search?: string; 
  
  @IsOptional()
  @IsEnum(AuctionStatus)
  estado?: AuctionStatus;

  @IsOptional()
  @IsDateString()
  startDate?: string; 

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;

  @IsOptional()
  @IsString()
  sort?: string; 
}