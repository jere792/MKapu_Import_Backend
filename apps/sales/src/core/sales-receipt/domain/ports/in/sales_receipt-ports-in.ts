/* ============================================
   apps/sales/src/core/sales-receipt/domain/ports/in/sales_receipt-ports-in.ts
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
  SalesReceiptSummaryListResponse,
  SalesReceiptWithHistoryDto,
  CustomerPurchaseHistoryDto,
  SalesReceiptAutocompleteResponseDto,
} from '../../../application/dto/out';

// ─── COMANDOS ─────────────────────────────────────────────────────────────────

export interface ISalesReceiptCommandPort {
  registerReceipt(dto: RegisterSalesReceiptDto): Promise<SalesReceiptResponseDto>;
  annulReceipt(dto: AnnulSalesReceiptDto): Promise<SalesReceiptResponseDto>;
  deleteReceipt(id: number): Promise<SalesReceiptDeletedResponseDto>;
}

// ─── CONSULTAS ────────────────────────────────────────────────────────────────

export interface ISalesReceiptQueryPort {
  // Listados
  listReceipts(filters?: ListSalesReceiptFilterDto): Promise<SalesReceiptListResponse>;
  listReceiptsSummary(filters?: ListSalesReceiptFilterDto): Promise<SalesReceiptSummaryListResponse>; // ✅ nuevo

  // Por ID
  getReceiptById(id: number): Promise<SalesReceiptResponseDto | null>;
  getReceiptWithHistory(id: number): Promise<SalesReceiptWithHistoryDto>;           // ✅ nuevo

  // Por serie
  getReceiptsBySerie(serie: string): Promise<SalesReceiptListResponse>;

  // Cliente
  findCustomerByDocument(documentNumber: string): Promise<any>;
  getCustomerPurchaseHistory(customerId: string): Promise<CustomerPurchaseHistoryDto>; // ✅ nuevo

  // Autocomplete
  autocompleteCustomers(
    search: string,
    sedeId?: number,
  ): Promise<SalesReceiptAutocompleteResponseDto[]>;
}
