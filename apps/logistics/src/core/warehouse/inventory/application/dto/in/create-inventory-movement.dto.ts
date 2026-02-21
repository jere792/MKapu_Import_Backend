/* apps/logistics/src/core/warehouse/inventory/application/dto/in/create-inventory-movement.dto.ts */
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

class InventoryItemDto {
  @IsInt()
  productId: number;

  @IsInt()
  warehouseId: number;

  @IsInt()
  sedeId: number;

  @IsNumber()
  quantity: number;

  @IsEnum(['INGRESO', 'SALIDA'])
  type: 'INGRESO' | 'SALIDA';
}

export class CreateInventoryMovementDto {
  @IsEnum(['TRANSFERENCIA', 'COMPRA', 'VENTA', 'AJUSTE'])
  originType: 'TRANSFERENCIA' | 'COMPRA' | 'VENTA' | 'AJUSTE';

  @IsInt()
  refId: number;

  @IsString()
  refTable: string;

  @IsOptional()
  @IsString()
  observation?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InventoryItemDto)
  items: InventoryItemDto[];
}
