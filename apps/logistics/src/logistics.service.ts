/* logistics/src/logistics.service.ts */
import { Injectable } from '@nestjs/common';
import { InventoryCommandService } from './core/warehouse/inventory/application/service/inventory-command.service';
import { MovementRequest } from './core/warehouse/inventory/domain/ports/in/inventory-movement-ports-in.';

@Injectable()
export class LogisticsService {
  constructor(private readonly stockService: InventoryCommandService) {}

  /* logistics/src/logistics.service.ts */
  async registerMovement(data: {
    productId: number;
    warehouseId: number;
    headquartersId: number | string;
    quantityDelta: number;
    reason: string;
  }): Promise<void> {
    const origin = data.reason as
      | 'TRANSFERENCIA'
      | 'COMPRA'
      | 'VENTA'
      | 'AJUSTE';

    // 1. Construimos el objeto CUMPLIENDO con todas las propiedades del DTO
    const movementRequest: MovementRequest = {
      originType: origin,
      // Agregamos estas propiedades que tu Omit heredó del DTO original
      refId: 0,
      refTable: 'VENTA_TCP',
      observation: `Movimiento generado por ${data.reason}`,
      items: [
        {
          productId: data.productId,
          warehouseId: data.warehouseId,
          quantity: Math.abs(data.quantityDelta),
        },
      ],
    };

    if (data.quantityDelta < 0) {
      await this.stockService.registerExit(movementRequest);
    } else {
      await this.stockService.registerIncome(movementRequest);
    }
  }
}
