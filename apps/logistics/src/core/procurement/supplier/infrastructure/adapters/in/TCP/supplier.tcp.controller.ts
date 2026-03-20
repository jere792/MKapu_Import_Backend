import { Controller, Inject, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ISupplierQueryPort } from '../../../../domain/ports/in/supplier-ports-in';

@Controller()
export class SupplierTcpController {
  private readonly logger = new Logger(SupplierTcpController.name);

  constructor(
    @Inject('ISupplierQueryPort')
    private readonly supplierQueryService: ISupplierQueryPort,
  ) {}

  @MessagePattern('get_supplier_by_id')
  async getSupplierById(@Payload() payload: { id_proveedor: number }) {
    const id = Number(payload?.id_proveedor);
    this.logger.log(`📡 [TCP] get_supplier_by_id id_proveedor: ${id}`);

    if (!id || isNaN(id)) {
      return { ok: false, message: 'id_proveedor es obligatorio', data: null };
    }

    try {
      const supplier = await this.supplierQueryService.getSupplierById(id);
      return { ok: true, data: supplier ?? null };
    } catch (error) {
      this.logger.error(`❌ Error obteniendo proveedor ${id}:`, error);
      return { ok: false, data: null };
    }
  }
}