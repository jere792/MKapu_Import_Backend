/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsNumber,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateWarehouseDto {
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value?.trim())
  codigo: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim() ?? null)
  nombre?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim() ?? null)
  departamento?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim() ?? null)
  provincia?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim() ?? null)
  ciudad?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim() ?? null)
  direccion?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim() ?? null)
  telefono?: string;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;

  @IsNotEmpty({ message: 'El ID de la sede es obligatorio' })
  @IsNumber({}, { message: 'El ID de la sede debe ser un número' })
  id_sede: number;
}
