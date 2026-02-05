/* sales/src/core/warranty/application/dto/in/register-warranty.dto.ts */
import {
  IsInt,
  IsString,
  IsArray,
  ValidateNested,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';

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
  id_usuario_recepcion: string; // ID del cliente o empleado que recepciona

  @IsInt()
  id_sede_ref: number;

  @IsString()
  cod_prod: string; // Código del producto reclamado

  @IsString()
  prod_nombre: string; // Nombre del producto

  @IsString()
  @IsOptional()
  num_garantia?: string; // Si se genera en el front o backend

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RegisterWarrantyDetailDto)
  detalles: RegisterWarrantyDetailDto[];
}
