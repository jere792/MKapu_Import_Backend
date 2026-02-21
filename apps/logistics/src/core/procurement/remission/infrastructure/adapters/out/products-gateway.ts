/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
// apps/logistics/src/core/procurement/remission/infrastructure/adapters/out/products-gateway.ts

import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, timeout } from 'rxjs';
import { ProductsGatewayPort } from '../../../domain/ports/out/products-gateway.port';

@Injectable()
export class ProductsGateway implements ProductsGatewayPort {
  constructor(
    @Inject('ADMIN_SERVICE') private readonly adminClient: ClientProxy,
  ) {}

  async getProductsInfo(ids: string[]): Promise<any[]> {
    try {
      return await firstValueFrom(
        this.adminClient
          .send({ cmd: 'get_products_info_for_remission' }, ids)
          .pipe(timeout(5000)),
      );
    } catch (error) {
      console.error(
        '[TCP LOGISTICS] Error al obtener pesos de productos:',
        error.message,
      );
      return [];
    }
  }
}
