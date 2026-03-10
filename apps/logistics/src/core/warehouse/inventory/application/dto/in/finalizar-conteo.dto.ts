import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  ValidateNested,
} from 'class-validator';

export enum ConteoEstado {
  PENDIENTE = 'PENDIENTE',
  INICIADO = 'INICIADO',
  FINALIZADO = 'FINALIZADO',
  ANULADO = 'ANULADO',
}

export class ConteoDetalleInputDto {
  @IsInt()
  @IsNotEmpty()
  id_detalle: number;

  @IsNumber()
  @IsNotEmpty()
  stock_conteo: number;
  @IsInt()
  @IsOptional()
  warehouseId?: number;
}

export class FinalizarConteoDto {
  @IsEnum(ConteoEstado)
  @IsNotEmpty()
  estado: ConteoEstado;

  @IsInt()
  @IsOptional()
  total_items?: number;

  @IsNumber()
  @IsOptional()
  total_diferencias?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ConteoDetalleInputDto)
  @IsOptional()
  data?: ConteoDetalleInputDto[];
}
