import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { InventoryCommandService } from '../../../../application/service/inventory/inventory-command.service';
import { MovementRequest } from '../../../../domain/ports/in/inventory-movement-ports-in.';

@Controller()
export class InventoryMessageController {
  private readonly logger = new Logger(InventoryMessageController.name);

  constructor(
    private readonly inventoryCommandService: InventoryCommandService,
  ) {}

  @MessagePattern({ cmd: 'register_movement' })
  async handleRegisterMovement(
    @Payload()
    data: {
      productId: number;
      warehouseId: number;
      headquartersId: number;
      quantityDelta: number;
      reason: string;
      refId?: number;
      serie?: string;
      numero?: string;
    },
  ): Promise<{ success: boolean }> {
    this.logger.log(
      `📥 TCP recibido — producto: ${data.productId} | delta: ${data.quantityDelta} | razón: ${data.reason}`,
    );

    const isIngreso = data.quantityDelta > 0;

    const originType: 'VENTA' | 'AJUSTE' = data.reason.startsWith('ANULACION')
      ? 'AJUSTE'
      : 'VENTA';

    const docRef =
      data.serie && data.numero
        ? `${data.serie}-${data.numero}`
        : data.refId
          ? `#${data.refId}`
          : '';

    const payload: MovementRequest = {
      originType,
      refId: data.refId ?? 0,
      refTable: 'comprobante_venta',
      observation: docRef
        ? `${data.reason} — Comprobante ${docRef}`
        : data.reason,
      items: [
        {
          productId: data.productId,
          warehouseId: data.warehouseId,
          sedeId: data.headquartersId,
          quantity: Math.abs(data.quantityDelta),
        },
      ],
    };

    if (isIngreso) {
      await this.inventoryCommandService.registerIncome(payload);
    } else {
      await this.inventoryCommandService.registerExit(payload);
    }

    this.logger.log(
      `✅ Movimiento registrado — producto: ${data.productId} | tipo: ${isIngreso ? 'INGRESO' : 'SALIDA'} | ref: ${docRef}`,
    );

    return { success: true };
  }
}