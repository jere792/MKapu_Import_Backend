import { Stock } from '../../entity/stock-domain-intity';

export interface StockPortsOut {
  findStock(
    productId: number,
    warehouseId: number,
    headquartersId: string,
  ): Promise<Stock | null>;

  updateQuantity(stockId: number, newQuantity: number): Promise<void>;

  create(stock: Stock): Promise<Stock>;
}
