/* logistics/src/logistics.controller.ts */
import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { LogisticsService } from './logistics.service';

@Controller()
export class LogisticsController {
  constructor(private readonly logisticsService: LogisticsService) {}

  @MessagePattern({ cmd: 'register_movement' })
  async registerMovement(@Payload() data: any) {
    return await this.logisticsService.registerMovement(data);
  }
}
