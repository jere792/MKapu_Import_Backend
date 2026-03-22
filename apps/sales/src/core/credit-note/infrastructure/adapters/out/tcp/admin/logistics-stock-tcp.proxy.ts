/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class LogisticsStockProxy {
  constructor(
    @Inject('LOGISTICS_SERVICE') private readonly client: ClientProxy,
  ) {}

  async increaseStock(
    productId: number,
    quantity: number,
    refId: number,
    headquarterId: number,
  ) {
    const pattern = { cmd: 'increase_stock' };

    return await firstValueFrom(
      this.client.send(pattern, { productId, quantity, refId, headquarterId }),
    );
  }
}
