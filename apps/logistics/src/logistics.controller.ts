import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { LogisticsService } from './logistics.service';

@Controller()
export class LogisticsController {
  getHello(): any {
    throw new Error('Method not implemented.');
  }
  private readonly logger = new Logger(LogisticsController.name);

  constructor(private readonly logisticsService: LogisticsService) {}

  @MessagePattern('register_movement') 
  async registerMovement(@Payload() data: any) {
    this.logger.log('📥 Evento TCP recibido: register_movement');
    
    try {
      await this.logisticsService.registerMovement(data);
      
      this.logger.log('Movimiento procesado exitosamente');
      
      return { success: true }; 
      
    } catch (error) {
      this.logger.error(`Error procesando movimiento: ${error.message}`);
      throw error; 
    }
  }
}