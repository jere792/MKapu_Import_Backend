/* sales/src/core/sales-receipt/domain/ports/in/sales-receipt-ports-in.ts */

import {
  RegisterSalesReceiptDto,
  AnnulSalesReceiptDto,
  ListSalesReceiptFilterDto,
} from '../../../application/dto/in';

import {
  SalesReceiptResponseDto,
  SalesReceiptListResponse,
  SalesReceiptDeletedResponseDto,
  SalesReceiptSummaryListResponse,
  SalesReceiptWithHistoryDto,
  CustomerPurchaseHistoryDto,
} from '../../../application/dto/out';

export interface ISalesReceiptCommandPort {
  registerReceipt(
    dto: RegisterSalesReceiptDto,
  ): Promise<SalesReceiptResponseDto>;
  annulReceipt(dto: AnnulSalesReceiptDto): Promise<SalesReceiptResponseDto>;
  deleteReceipt(id: number): Promise<SalesReceiptDeletedResponseDto>;
}

export interface ISalesReceiptQueryPort {
  listReceipts(
    filters?: ListSalesReceiptFilterDto,
  ): Promise<SalesReceiptListResponse>;
  
  listReceiptsSummary(
    filters?: ListSalesReceiptFilterDto,
  ): Promise<SalesReceiptSummaryListResponse>;
  
  getReceiptById(id: number): Promise<SalesReceiptResponseDto | null>;
  
  getReceiptWithHistory(id: number): Promise<SalesReceiptWithHistoryDto>;
  
  getCustomerPurchaseHistory(
    customerId: string,
  ): Promise<CustomerPurchaseHistoryDto>;
  
  getReceiptsBySerie(serie: string): Promise<SalesReceiptListResponse>;
}
