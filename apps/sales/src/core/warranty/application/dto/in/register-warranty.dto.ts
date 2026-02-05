/* sales/src/core/warranty/application/dto/in/register-warranty.dto.ts */
import {
  IsInt,
  IsString,
  IsArray,
  ValidateNested,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Optional } from '@nestjs/common';

export class RegisterWarrantyDetailDto {
  @IsString()
  tipo_solicitud: string;

  @IsString()
  descripcion: string;
}

export class RegisterWarrantyDto {
  @IsInt()
  id_comprobante: number;

  @IsString()
  @Optional()
  id_usuario_recepcion: string;

  @IsOptional()
  @IsString()
  id_usuario_ref?: string;

  @IsInt()
  id_sede_ref: number;

  @IsString()
  cod_prod: string;

  @IsString()
  prod_nombre: string;

  @IsString()
  @IsOptional()
  num_garantia?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RegisterWarrantyDetailDto)
  detalles: RegisterWarrantyDetailDto[];
}
