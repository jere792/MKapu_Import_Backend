/* apps/sales/src/core/sales-receipt/application/dto/out/sales-receipt-summary.dto.ts */

export interface SalesReceiptSummaryDto {
  idComprobante: number;
  numeroCompleto: string;
  serie: string;
  numero: number;
  tipoComprobante: string;
  fecEmision: Date;
  clienteNombre: string;
  clienteDocumento: string;
  idResponsable: string;
  responsableNombre: string;
  idSede: number;
  sedeNombre: string;
  metodoPago: string;
  total: number;
  estado: string;
}

export interface SalesReceiptSummaryListResponse {
  receipts: SalesReceiptSummaryDto[];
  total: number;
}
