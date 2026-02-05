/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* sales/src/core/sales-receipt/infrastructure/adapters/out/http/logistics-stock.proxy.ts */
import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class LogisticsStockProxy {
  constructor(
    @Inject('LOGISTICS_SERVICE') private readonly client: ClientProxy,
  ) {}

  async registerMovement(data: {
    productId: number;
    warehouseId: number;
    headquartersId: number;
    quantityDelta: number;
    reason: string;
  }): Promise<void> {
    try {
      const pattern = { cmd: 'register_movement' };
      await lastValueFrom(this.client.send(pattern, data));
    } catch (error) {
      throw new Error(
        `Error en Logística: ${error.response?.data?.message || error.message}`,
      );
    }
  }
}
