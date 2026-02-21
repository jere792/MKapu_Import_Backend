/* sales/src/core/sales-receipt/application/dto/in/list-sales-receipt-filter.dto.ts*/

export interface ListSalesReceiptFilterDto {

  page?: number;
  limit?: number;

  status?: 'EMITIDO' | 'ANULADO' | 'RECHAZADO';
  customerId?: string;
  receiptTypeId?: number;
  dateFrom?: Date;
  dateTo?: Date;

  search?: string;
  sedeId?: number;
}
