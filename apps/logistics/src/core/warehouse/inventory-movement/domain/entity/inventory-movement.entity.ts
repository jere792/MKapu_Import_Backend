export type OriginType = 'TRANSFERENCIA' | 'COMPRA' | 'VENTA' | 'AJUSTE';
export type DetailType = 'INGRESO' | 'SALIDA';

// Clase pequeña para el detalle
export class InventoryDetail {
  constructor(
    public readonly productId: number,
    public readonly warehouseId: number,
    public readonly quantity: number,
    public readonly type: DetailType,
  ) {}
}
export interface InventoryMovementProps {
  id?: number;
  originType: OriginType;
  refId: number;
  refTable: string;
  observation?: string;
  date?: Date;
  items: InventoryDetail[];
}
export class InventoryMovement {
  constructor(private readonly props: InventoryMovementProps) {}
  static createFromPurchaseOrder(
    purchaseOrderId: number,
    items: { productId: number; warehouseId: number; quantity: number }[],
  ): InventoryMovement {
    const inventoryDetails = items.map(
      (item) =>
        new InventoryDetail(
          item.productId,
          item.warehouseId,
          item.quantity,
          'INGRESO',
        ),
    );
    return new InventoryMovement({
      originType: 'COMPRA',
      refId: purchaseOrderId,
      refTable: 'orden_compra',
      items: inventoryDetails,
    });
  }
  get id() {
    return this.props.id;
  }
  get originType() {
    return this.props.originType;
  }
  get refId() {
    return this.props.refId;
  }
  get refTable() {
    return this.props.refTable;
  }
  get observation() {
    return this.props.observation;
  }
  get items() {
    return this.props.items;
  }
  get date() {
    return this.props.date;
  }
}
