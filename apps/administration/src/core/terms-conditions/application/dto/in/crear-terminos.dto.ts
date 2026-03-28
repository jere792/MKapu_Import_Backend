// application/dto/in/crear-terminos.dto.ts
import { Type } from 'class-transformer';
import {
  IsString, IsBoolean, IsOptional, IsInt,
  IsArray, ValidateNested, IsNotEmpty, Min,
} from 'class-validator';

export class CrearTerminosItemDto {
  @IsString() @IsNotEmpty()
  contenido: string;

  @IsInt() @Min(1)
  orden: number;
}

export class CrearTerminosParrafoDto {
  @IsString() @IsNotEmpty()
  contenido: string;

  @IsInt() @Min(1)
  orden: number;
}

export class CrearTerminosSeccionDto {
  @IsString() @IsNotEmpty()
  numero: string;

  @IsString() @IsNotEmpty()
  titulo: string;

  @IsInt() @Min(1)
  orden: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CrearTerminosParrafoDto)
  parrafos: CrearTerminosParrafoDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CrearTerminosItemDto)
  items: CrearTerminosItemDto[];
}

export class CrearTerminosDto {
  @IsString() @IsNotEmpty()
  version: string;

  @IsString() @IsNotEmpty()
  fechaVigencia: string;

  @IsBoolean() @IsOptional()
  activo?: boolean;

  @IsInt() @IsOptional()
  creadoPor?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CrearTerminosSeccionDto)
  secciones: CrearTerminosSeccionDto[];
}
