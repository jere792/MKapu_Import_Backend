/* logistics/src/logistics.service.ts */
import { Injectable } from '@nestjs/common';

@Injectable()
export class LogisticsService {
  getHello(): string {
    return 'Hello World!';
  }
}
