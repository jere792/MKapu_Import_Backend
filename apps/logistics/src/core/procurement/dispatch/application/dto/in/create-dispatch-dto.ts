import { DispatchStatus } from '../../../domain/entity/dispatch-domain-entity';
import {
  IsNotEmpty,
  IsNumber,
  IsString,
  IsEnum,
  IsDateString,
  IsOptional,
} from 'class-validator';

export class CreateDispatchDto {
  @IsOptional() @IsNumber()
  id_despacho?: number;

  @IsNotEmpty() @IsNumber()
  id_venta_ref: number;

  @IsNotEmpty() @IsString()
  id_usuario_ref: string;

  @IsNotEmpty() @IsNumber()
  id_almacen_origen: number;

  @IsOptional() @IsDateString()
  fecha_creacion?: string;

  @IsOptional() @IsDateString()
  fecha_programada?: string;

  @IsNotEmpty() @IsDateString()
  fecha_salida: string;

  @IsNotEmpty() @IsDateString()
  fecha_entrega: string;

  @IsNotEmpty() @IsString()
  direccion_entrega: string;

  @IsOptional() @IsString()
  observacion?: string;

  @IsOptional() @IsEnum(DispatchStatus)
  estado?: DispatchStatus;
}