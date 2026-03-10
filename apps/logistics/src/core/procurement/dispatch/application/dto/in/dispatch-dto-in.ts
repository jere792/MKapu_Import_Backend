// apps/logistics/src/core/procurement/dispatch/application/dto/in/create-dispatch-dto.ts

import {
  IsNotEmpty,
  IsNumber,
  IsString,
  IsEnum,
  IsDateString,
  IsOptional,
} from 'class-validator';
import { DispatchStatus } from '../../../domain/entity/dispatch-domain-entity';

export class CreateDispatchDto {
  @IsNotEmpty()
  @IsNumber()
  id_despacho: number;

  @IsNotEmpty()
  @IsNumber()
  id_venta_ref: number;

  @IsNotEmpty()
  @IsString()
  tipo_envio: string;

  @IsOptional()
  @IsEnum(DispatchStatus)
  estado?: DispatchStatus;

  @IsNotEmpty()
  @IsDateString()
  fecha_envio: string;
}