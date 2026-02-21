import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { SalesReceiptRepository } from '../../out/repository/sales-receipt.respository';

@Controller()
export class SalesEventsController {
  constructor(private readonly salesRepo: SalesReceiptRepository) {}

  @MessagePattern({ cmd: 'update_dispatch_status' })
  async handleDispatchStatusUpdate(
    @Payload() data: { id_venta: number; status: string },
  ) {
    // Aquí actualizas el estado de la venta sin romper la arquitectura
    await this.salesRepo.updateStatus(data.id_venta, data.status);
    return { success: true };
  }
}
