import { IsInt, IsNumber, IsOptional } from 'class-validator';

export class OpenCashboxDto {
  @IsInt()
  id_sede_ref: number;

  @IsNumber()
  @IsOptional()
  monto_inicial?: number;
}