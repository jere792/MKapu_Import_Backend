import { Injectable, Inject, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class LogisticsStockProxy {
  private readonly logger = new Logger(LogisticsStockProxy.name);

  constructor(@Inject('LOGISTICS_SERVICE') private readonly client: ClientProxy) {}

  async registerMovement(data: any): Promise<void> {
    try {
      await firstValueFrom(
        this.client.send('register_movement', data)
      );
      
      this.logger.log(`📤 Evento de stock procesado para producto: ${data.productId}`);
    } catch (error) {
      this.logger.error(`❌ Error al registrar movimiento: ${error.message}`);
      throw new Error('Error de comunicación con Logística');
    }
  }
}