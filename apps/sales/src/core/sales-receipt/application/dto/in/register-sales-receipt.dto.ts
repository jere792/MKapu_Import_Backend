export interface SalesReceiptItemDto {
  productId: string;
  quantity: number;
  unitPrice: number;
  description: string;
  total: number;
  igv?: number;
  codigo?: string; // ← para reglas PRODUCTO
  categoriaId?: number; // ← para reglas CATEGORIA
}

export interface RegisterSalesReceiptDto {
  customerId: string;
  customerName: string;
  saleTypeId: number;
  receiptTypeId: number;
  serie: string;
  dueDate: Date;
  operationType?: string;
  subtotal: number;
  igv: number;
  isc: number;
  total: number;
  currencyCode?: string;
  responsibleId: string;
  branchId: number;
  warehouseId: number;
  paymentMethodId: number;
  operationNumber?: string | null;
  esCreditoPendiente?: boolean;
  promotionId?: number | null;
  descuento?: number;
  items: SalesReceiptItemDto[];
}
