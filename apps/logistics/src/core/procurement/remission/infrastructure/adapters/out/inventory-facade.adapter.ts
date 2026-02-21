import { Injectable } from '@nestjs/common';
import { CreateInventoryMovementDto } from 'apps/logistics/src/core/warehouse/inventory/application/dto/in/create-inventory-movement.dto';
import { InventoryCommandService } from 'apps/logistics/src/core/warehouse/inventory/application/service/inventory-command.service';
import {
  InventoryFacadePort,
  DeductStockParams,
} from '../../../domain/ports/out/facade/inventory-facade.port';

@Injectable()
export class InventoryFacadeAdapter implements InventoryFacadePort {
  constructor(
    private readonly inventoryCommandService: InventoryCommandService,
  ) {}

  async deductStockForRemission(params: DeductStockParams): Promise<void> {
    const movementDto: CreateInventoryMovementDto = {
      originType: 'VENTA',
      refId: params.refId,
      refTable: 'guia_remision',
      observation: `Salida por emisión de Guía ${params.serie_numero}`,
      items: params.items.map((item) => ({
        productId: item.id_producto,
        warehouseId: params.warehouseId,
        quantity: item.cantidad,
        type: 'SALIDA',
      })),
    };
    await this.inventoryCommandService.executeMovement(movementDto);
  }
}
