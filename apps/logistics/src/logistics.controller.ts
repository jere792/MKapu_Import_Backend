/* logistics/src/logistics.controller.ts */
import { Controller, Get } from '@nestjs/common';
import { LogisticsService } from './logistics.service';

@Controller()
export class LogisticsController {
  constructor(private readonly logisticsService: LogisticsService) {}

  @Get()
  getHello(): string {
    return this.logisticsService.getHello();
  }
}
