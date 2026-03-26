import {
  RegisterSalesReceiptDto,
  AnnulSalesReceiptDto,
  ListEmployeeSalesFilterDto,
  ListSalesReceiptFilterDto,
} from '../../../application/dto/in';

import {
  EmployeeSalesListResponseDto,
  SalesReceiptResponseDto,
  SalesReceiptListResponse,
  SalesReceiptDeletedResponseDto,
  SalesReceiptKpiDto,
  SalesReceiptSummaryListDto,
  SalesReceiptDetalleCompletoDto,
  SaleTypeResponseDto,
  ReceiptTypeResponseDto,
} from '../../../application/dto/out';

import { KpiFilterParams } from '../out/sales_receipt-ports-out';

import { Empresa } from 'apps/administration/src/core/company/domain/entity/empresa.entity';
export interface ISalesReceiptCommandPort {
  registerReceipt(
    dto: RegisterSalesReceiptDto,
  ): Promise<SalesReceiptResponseDto>;
  annulReceipt(dto: AnnulSalesReceiptDto): Promise<SalesReceiptResponseDto>;
  deleteReceipt(id: number): Promise<SalesReceiptDeletedResponseDto>;
  updateDispatchStatus(id_venta: number, status: string): Promise<boolean>;
  emitReceipt(
    id: number,
    paymentTypeId?: number,
  ): Promise<SalesReceiptResponseDto>;

  enviarComprobantePorEmail(id: number): Promise<{ success: boolean; message: string }>;
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

  getKpiSemanal(filters: KpiFilterParams): Promise<SalesReceiptKpiDto>;

  listReceiptsPaginated(
    filters: ListSalesReceiptFilterDto,
  ): Promise<SalesReceiptSummaryListDto>;

  getAllSaleTypes(): Promise<SaleTypeResponseDto[]>;
  getAllReceiptTypes(): Promise<ReceiptTypeResponseDto[]>;

  getEmpresa(id: number): Promise<any>;
  listEmployeeSales(
    filters: ListEmployeeSalesFilterDto,
  ): Promise<EmployeeSalesListResponseDto>;
}
