/* sales/src/sales.service.ts */
import { Injectable } from '@nestjs/common';

@Injectable()
export class SalesService {
  getHello(): string {
    return 'Hello World!';
  }
}
