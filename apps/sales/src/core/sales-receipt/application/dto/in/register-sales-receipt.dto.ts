export interface SalesReceiptItemDto {
  productId: string;
  quantity: number;
  unitPrice: number;
  description: string;
  total: number;
  igv?: number;
}

export interface RegisterSalesReceiptDto {
  customerId: string;
  saleTypeId: number;
  receiptTypeId: number;
  serie: string;
  dueDate: Date;
  operationType: string;
  subtotal: number;
  igv: number;
  isc: number;
  total: number;
  currencyCode: string;
  responsibleId: string;
  branchId: number;
  items: SalesReceiptItemDto[];
  paymentMethodId: number;
}
