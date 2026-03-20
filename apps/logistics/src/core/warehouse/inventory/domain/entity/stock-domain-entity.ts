export class Stock {
  constructor(
    public id: number | undefined,
    public productId: number,
    public warehouseId: number,
    public headquartersId: string,
    public quantity: number,
    public locationType: string,
    public status: string,
    public headquartersName?: string,
  ) {}

  applyMovement(delta: number) {
    const newTotal = this.quantity + delta;
    if (newTotal < 0) {
      throw new Error(
        `Stock insuficiente. Actual: ${this.quantity}, intento: ${delta}`,
      );
    }

    this.quantity = newTotal;
  }
}
