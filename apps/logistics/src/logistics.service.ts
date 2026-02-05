/* logistics/src/logistics.service.ts */
import { Injectable } from '@nestjs/common';
import { StockService } from './core/warehouse/stock/application/service/stock.service';

@Injectable()
export class LogisticsService {
  constructor(private readonly stockService: StockService) {}
  getHello(): string {
    return 'Hello World!';
  }
  async registerMovement(data: {
    productId: number;
    warehouseId: number;
    headquartersId: number | string;
    quantityDelta: number;
    reason: 'VENTA' | 'COMPRA' | 'TRANSFERENCIA' | 'AJUSTE';
  }): Promise<void> {
    const headquartersIdString = String(data.headquartersId);
    await this.stockService.applyMovement(
      data.productId,
      data.warehouseId,
      headquartersIdString,
      data.quantityDelta,
      data.reason,
    );
  }
}
