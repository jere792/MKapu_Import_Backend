/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
import { Inject, Injectable } from '@nestjs/common';
import { StockPortsIn } from '../../domain/ports/in/stock-ports-in';
import { StockPortsOut } from '../../domain/ports/out/stock-ports-out';
import { Stock } from '../../domain/entity/stock-domain-intity';

@Injectable()
export class StockService implements StockPortsIn {
  constructor(
    @Inject('StockPortsOut')
    private readonly stockRepo: StockPortsOut,
  ) {}
  async updateStock(
    productId: number,
    warehouseId: number,
    headquartersId: string,
    quantityDelta: number,
  ): Promise<void> {
    const currentStock = await this.stockRepo.findStock(
      productId,
      warehouseId,
      headquartersId,
    );

    if (currentStock) {
      const newQuantity = currentStock.calculateNewQuantity(quantityDelta);

      await this.stockRepo.updateQuantity(currentStock.id!, newQuantity);
    } else {
      const newStock = new Stock(
        undefined,
        productId,
        warehouseId,
        headquartersId,
        quantityDelta,
        'ALMACEN_CENTRAL', // Default
        'DISPONIBLE',
      );

      // 5. Persistir creación
      await this.stockRepo.create(newStock);
    }
  }
}
