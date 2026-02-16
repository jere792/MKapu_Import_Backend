/* apps/sales/src/core/sales-receipt/application/dto/out/customer-purchase-history.dto.ts */

export interface CustomerPurchaseHistoryDto {
  customer: {
    id: string;
    nombre: string;
    documento: string;
    tipoDocumento: string;
  };
  statistics: {
    totalCompras: number;
    totalEmitidos: number;
    totalAnulados: number;
    montoTotal: number;
    montoEmitido: number;
    promedioCompra: number;
  };
  recentPurchases: RecentPurchaseDto[];
}

export interface RecentPurchaseDto {
  idComprobante: number;
  numeroCompleto: string;
  tipoComprobante: string;
  fecha: Date | string;
  sedeNombre: string;
  total: number;
  estado: string;
}
