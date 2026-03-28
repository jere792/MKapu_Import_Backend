import { Injectable, Inject, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, timeout } from 'rxjs';

export interface RegisterMovementPayload {
  productId: number;
  warehouseId: number;
  headquartersId: number;
  quantityDelta: number;
  reason: string;
  refId?: number;
  serie?: string;
  numero?: string;
}


@Injectable()
export class LogisticsStockProxy {
  private readonly logger = new Logger(LogisticsStockProxy.name);

  constructor(
    @Inject('LOGISTICS_SERVICE') private readonly client: ClientProxy,
  ) {}

  async registerMovement(data: RegisterMovementPayload): Promise<void> {
    try {
      await firstValueFrom(
        this.client
          .send<{ success: boolean }>({ cmd: 'register_movement' }, data)
          .pipe(timeout(5000)),
      );

      this.logger.log(
        `📤 Movimiento enviado — producto: ${data.productId} | delta: ${data.quantityDelta}`,
      );
    } catch (error: any) {
      this.logger.error(
        `❌ Error al registrar movimiento de producto ${data.productId}: ${error?.message}`,
      );
      throw new Error('Error de comunicación con Logística');
    }
  }
}