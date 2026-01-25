export interface StockPortsIn {
  updateStock(
    productId: number,
    warehouseId: number,
    headquartersId: string,
    quantityDelta: number,
  ): Promise<void>;
}
