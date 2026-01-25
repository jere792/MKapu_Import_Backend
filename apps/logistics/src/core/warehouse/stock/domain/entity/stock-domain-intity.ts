export class Stock {
  constructor(
    public readonly id: number | undefined,
    public readonly productId: number,
    public readonly warehouseId: number,
    public readonly headquartersId: string,
    public readonly quantity: number,
    public readonly locationType: string,
    public readonly status: string,
  ) {}
  calculateNewQuantity(delta: number): number {
    const newQty = this.quantity + delta;
    if (newQty < 0) {
      throw new Error('Stock insuficiente');
    }
    return newQty;
  }
}
