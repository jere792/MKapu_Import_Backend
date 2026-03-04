export enum UnitStatus {
  AVAILABLE = 'DISPONIBLE',
  TRANSFERRING = 'TRANSFERIDO',
  SOLD = 'VENDIDO',
  DAMAGED = 'MERMA',
  DISCARDED = 'BAJA',
}

export class Unit {
  id?: number;
  productId: number;
  warehouseId: number;
  serialNumber: string;
  expirationDate: Date;
  status: UnitStatus;

  constructor(
    productId: number,
    warehouseId: number,
    serialNumber: string,
    expirationDate: Date,
    status: UnitStatus = UnitStatus.AVAILABLE,
    id?: number,
  ) {
    this.id = id;
    this.productId = productId;
    this.warehouseId = warehouseId;
    this.serialNumber = serialNumber;
    this.expirationDate = expirationDate;
    this.status = status;
  }

  markAsTransferring(): void {
    if (this.status !== UnitStatus.AVAILABLE) {
      throw new Error(
        `La unidad ${this.serialNumber} no está disponible para transferir. Estado actual: ${this.status}`,
      );
    }
    this.status = UnitStatus.TRANSFERRING;
  }

  completeTransfer(newWarehouseId: number): void {
    if (this.status !== UnitStatus.TRANSFERRING) {
      throw new Error(
        `No se puede completar transferencia de una unidad que no está en tránsito.`,
      );
    }
    this.status = UnitStatus.AVAILABLE;
    this.warehouseId = newWarehouseId;
  }

  // Marcar como vendida
  markAsSold(): void {
    if (this.status !== UnitStatus.AVAILABLE) {
      throw new Error(
        `No se puede vender la unidad ${this.serialNumber} porque no está disponible.`,
      );
    }
    this.status = UnitStatus.SOLD;
  }
}
