/* eslint-disable @typescript-eslint/require-await */
/* logistics/src/core/inventory/infrastructure/adapters/in/controllers/inventory-message.controller.ts */
import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';

@Controller()
export class InventoryMessageController {
  @MessagePattern({ cmd: 'register_movement' })
  async handleRegisterMovement(@Payload() data: any) {
    console.log('📥 ¡TCP REQUEST RECIBIDO EN LOGISTICS!', data);

    // Por ahora retornamos un OK para que Sales no explote
    return {
      status: 'success',
      message: 'Movimiento procesado en inventario',
    };
  }
}
