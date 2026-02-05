import { IsOptional, IsDateString, IsNumber } from 'class-validator';

export class UpdateWarrantyDto {
  @IsOptional()
  @IsDateString()
  fec_recepcion?: string; // Cambiado a string para validación de entrada

  @IsOptional()
  observaciones?: string;

  @IsNumber()
  @IsOptional()
  id_sede_ref?: number;
}
