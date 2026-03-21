import { IsString, IsDateString, IsNumber, IsArray, ValidateNested, IsOptional, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateQuoteDetailDto {
  @IsNumber()
  id_prod_ref: number;

  @IsString()
  cod_prod: string;

  @IsString()
  descripcion: string;

  @IsNumber()
  cantidad: number;

  @IsNumber()
  precio: number;

  @IsOptional()
  @IsNumber()
  id_almacen?: number;
}

export class CreateQuoteDto {
  @IsOptional()
  @IsString()
  documento_cliente?: string;       // obligatorio si tipo = VENTA

  @IsOptional()
  @IsString()
  id_proveedor?: string;            // obligatorio si tipo = COMPRA

  @IsDateString()
  fec_venc: string;

  @IsNumber()
  subtotal: number;

  @IsNumber()
  igv: number;

  @IsNumber()
  total: number;

  @IsNumber()
  id_sede: number;

  @IsOptional()
  @IsNumber()
  id_almacen?: number;

  @IsOptional()
  @IsEnum(['VENTA', 'COMPRA'])
  tipo?: 'VENTA' | 'COMPRA';

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateQuoteDetailDto)
  detalles: CreateQuoteDetailDto[];
}