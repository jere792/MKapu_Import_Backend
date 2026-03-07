import {
  RegisterSalesReceiptDto,
  AnnulSalesReceiptDto,
  ListSalesReceiptFilterDto,
} from '../../../application/dto/in';

import {
  SalesReceiptResponseDto,
  SalesReceiptListResponse,
  SalesReceiptDeletedResponseDto,
  SalesReceiptKpiDto,
  SalesReceiptSummaryListDto,
  SalesReceiptDetalleCompletoDto,
} from '../../../application/dto/out';

export interface ISalesReceiptCommandPort {
  registerReceipt(
    dto: RegisterSalesReceiptDto,
  ): Promise<SalesReceiptResponseDto>;
  annulReceipt(dto: AnnulSalesReceiptDto): Promise<SalesReceiptResponseDto>;
  deleteReceipt(id: number): Promise<SalesReceiptDeletedResponseDto>;
  updateDispatchStatus(id_venta: number, status: string): Promise<boolean>;
  emitReceipt(id: number): Promise<SalesReceiptResponseDto>;
}

export interface ISalesReceiptQueryPort {
  listReceipts(
    filters?: ListSalesReceiptFilterDto,
  ): Promise<SalesReceiptListResponse>;
  getReceiptById(id: number): Promise<SalesReceiptResponseDto | null>;
  getReceiptsBySerie(serie: string): Promise<SalesReceiptListResponse>;
  findSaleByCorrelativo(correlativo: string): Promise<any>;
  verifySaleForRemission(id: number): Promise<any>;
  
  getDetalleCompleto(
    id_comprobante: number,
    historialPage?: number,
  ): Promise<SalesReceiptDetalleCompletoDto | null>;

  getKpiSemanal(sedeId?: number): Promise<SalesReceiptKpiDto>;
  listReceiptsPaginated(
    filters: ListSalesReceiptFilterDto,
  ): Promise<SalesReceiptSummaryListDto>;
}
