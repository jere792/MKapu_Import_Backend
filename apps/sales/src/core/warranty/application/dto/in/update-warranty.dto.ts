import { IsOptional, IsDateString } from 'class-validator';

export class UpdateWarrantyDto {
  @IsDateString()
  @IsOptional()
  fec_recepcion?: Date;
}
