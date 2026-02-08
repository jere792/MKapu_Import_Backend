/* ============================================
   sales/src/core/sales-receipt/domain/ports/in/sales-receipt-ports-in.ts
   ============================================ */

import {
  RegisterSalesReceiptDto,
  AnnulSalesReceiptDto,
  ListSalesReceiptFilterDto,
} from '../../../application/dto/in';

import {
  SalesReceiptResponseDto,
  SalesReceiptListResponse,
  SalesReceiptDeletedResponseDto,
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
  getReceiptById(id: number): Promise<SalesReceiptResponseDto | null>;
  getReceiptsBySerie(serie: string): Promise<SalesReceiptListResponse>;
}
