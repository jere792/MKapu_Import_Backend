import { IsString, IsOptional, IsDateString } from 'class-validator';

export class UpdateWarrantyDto {
  @IsString()
  @IsOptional()
  observaciones?: string;

  @IsDateString()
  @IsOptional()
  fec_fin?: Date;
}
