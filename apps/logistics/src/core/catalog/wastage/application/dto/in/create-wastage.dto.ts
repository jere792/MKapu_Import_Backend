import { IsInt, IsPositive, IsString, IsArray, ValidateNested, IsNumber, Min, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateWastageDetailDto {
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  id_producto: number;

  @IsString()
  cod_prod: string;

  @IsString()
  desc_prod: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  cantidad: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  pre_unit: number;

  @Type(() => Number)
  @IsInt()
  @IsPositive()
  id_tipo_merma: number;

  @IsOptional()
  @IsString()
  observacion?: string;
}

export class CreateWastageDto {
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  id_usuario_ref: number;

  @Type(() => Number)
  @IsInt()
  @IsPositive()
  id_sede_ref: number;

  @Type(() => Number)
  @IsInt()
  @IsPositive()
  id_almacen_ref: number;

  @IsString()
  motivo: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateWastageDetailDto)
  detalles: CreateWastageDetailDto[];
}