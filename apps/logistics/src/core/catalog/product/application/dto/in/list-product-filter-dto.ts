/* ============================================
   APPLICATION LAYER - DTO IN
   logistics/src/core/catalog/product/application/dto/in/list-product-filter-dto.ts
   ============================================ */

import { IsOptional, IsString, IsNumber, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export class ListProductFilterDto {
  @IsOptional()
  @IsString()
  search?: string; // Campo para coincidencia de caracteres (código, descripción, anexo)

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  estado?: boolean;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  id_categoria?: number; // Ej: Freidora: 1, Parrilla: 6, Balanza: 9

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  minPrice?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  maxPrice?: number;

  // Configuración para vista 5 por 5 en MKapu Import
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  page?: number = 1; 

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  limit?: number = 5; 
}