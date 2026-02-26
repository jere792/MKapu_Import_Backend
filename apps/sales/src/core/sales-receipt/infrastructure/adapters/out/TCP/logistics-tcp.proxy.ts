import { Injectable, Inject, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, timeout } from 'rxjs';

@Injectable()
export class LogisticsTcpProxy {
  private readonly logger = new Logger(LogisticsTcpProxy.name);

  constructor(
    @Inject('LOGISTICS_SERVICE')
    private readonly client: ClientProxy,
  ) {}

  async getProductsCodigoByIds(
    ids: number[],
  ): Promise<Map<number, string>> {
    if (!ids || ids.length === 0) return new Map();

    try {
      const result = await firstValueFrom(
        this.client
          .send<{ id_producto: number; codigo: string }[]>(
            { cmd: 'get_products_codigo_by_ids' },
            ids,
          )
          .pipe(timeout(5000)),
      );

      const map = new Map<number, string>();
      for (const item of result ?? []) {
        map.set(item.id_producto, item.codigo);
      }
      return map;
    } catch (error: any) {
      this.logger.warn(
        `⚠️ No se pudo obtener códigos de productos: ${error?.message}`,
      );
      return new Map();
    }
  }
}