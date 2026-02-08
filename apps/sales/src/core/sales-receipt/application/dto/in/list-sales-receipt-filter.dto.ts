export interface ListSalesReceiptFilterDto {
  status?: 'EMITIDO' | 'ANULADO' | 'RECHAZADO';
  customerId?: string;
  receiptTypeId?: number;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
}
