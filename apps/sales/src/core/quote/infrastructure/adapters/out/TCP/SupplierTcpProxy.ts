import { Injectable, Inject, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, timeout } from 'rxjs';
import { ISupplierProxy, SupplierInfo } from '../../../../domain/ports/out/supplier-proxy.port';

@Injectable()
export class SupplierTcpProxy implements ISupplierProxy {
  private readonly logger = new Logger(SupplierTcpProxy.name);

  constructor(
    @Inject('LOGISTICS_SERVICE')
    private readonly client: ClientProxy,
  ) {}

  async getSupplierById(id_proveedor: number): Promise<SupplierInfo | null> {
    try {
      const response = await firstValueFrom(
        this.client
          .send<{ ok: boolean; data: SupplierInfo | null }>(
            'get_supplier_by_id',
            { id_proveedor },
          )
          .pipe(timeout(5000)),
      );
      return response?.data ?? null;
    } catch (error: any) {
      this.logger.warn(`⚠️ No se pudo obtener proveedor ${id_proveedor}: ${error?.message}`);
      return null;
    }
  }
}