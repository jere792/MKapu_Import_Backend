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
  updateDispatchStatus(id_venta: number, status: string): Promise<boolean>;
}

export interface ISalesReceiptQueryPort {
  listReceipts(
    filters?: ListSalesReceiptFilterDto,
  ): Promise<SalesReceiptListResponse>;
  getReceiptById(id: number): Promise<SalesReceiptResponseDto | null>;
  getReceiptsBySerie(serie: string): Promise<SalesReceiptListResponse>;
  findSaleByCorrelativo(correlativo: string): Promise<any>;
  verifySaleForRemission(id: number): Promise<any>;
}
