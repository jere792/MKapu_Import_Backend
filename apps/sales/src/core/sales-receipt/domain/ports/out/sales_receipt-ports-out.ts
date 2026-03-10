import { QueryRunner } from 'typeorm';
import { SalesReceipt } from '../../entity/sales-receipt-domain-entity';
import { SalesReceiptOrmEntity } from '../../../infrastructure/entity/sales-receipt-orm.entity';
import { SalesType } from '../../entity/sale-type-domain-entity';
import { ReceiptType } from '../../entity/receipt-type-domain-entity';

export interface SalesReceiptKpiRaw {
  total_ventas: number;
  cantidad_ventas: number;
  total_boletas: number;
  total_facturas: number;
  cantidad_boletas: number;
  cantidad_facturas: number;
}
export interface SalesReceiptSummaryRaw {
  id_comprobante: number;
  serie: string;
  numero: number;
  tipo_comprobante: string;
  fec_emision: Date;
  cliente_nombre: string;
  cliente_doc: string;
  id_responsable: string;
  id_sede: number;
  metodo_pago: string;
  total: number;
  estado: string;
}

export interface ISalesReceiptRepositoryPort {
  save(receipt: SalesReceipt): Promise<SalesReceipt>;
  update(receipt: SalesReceipt): Promise<SalesReceipt>;
  delete(id: number): Promise<void>;
  findById(id: number): Promise<SalesReceipt | null>;
  findBySerie(serie: string): Promise<SalesReceipt[]>;

  findAll(filters?: {
    estado?: 'EMITIDO' | 'ANULADO' | 'RECHAZADO';
    id_cliente?: string;
    id_tipo_comprobante?: number;
    fec_desde?: Date | string;
    fec_hasta?: Date | string;
    search?: string;
  }): Promise<SalesReceipt[]>;

  getNextNumber(serie: string): Promise<number>;
  getQueryRunner(): QueryRunner;
  getNextNumberWithLock(
    serie: string,
    queryRunner: QueryRunner,
  ): Promise<number>;
  updateStatus(id: number, status: string): Promise<SalesReceiptOrmEntity>;
  findByCorrelativo(
    serie: string,
    numero: number,
  ): Promise<SalesReceiptOrmEntity | null>;

  findDetalleCompleto(
    id_comprobante: number,
    historialPage?: number,
    historialLimit?: number,
  ): Promise<any>;

  getKpiSemanal(sedeId?: number): Promise<SalesReceiptKpiRaw>;

  findAllPaginated(
    filters: {
      estado?: string;
      id_cliente?: string;
      id_tipo_comprobante?: number;
      id_metodo_pago?: number;
      fec_desde?: Date | string;
      fec_hasta?: Date | string;
      search?: string;
      sedeId?: number;
    },
    page: number,
    limit: number,
  ): Promise<[SalesReceiptSummaryRaw[], number]>;

  findAllSaleTypes(): Promise<SalesType[]>;
  findAllReceiptTypes(): Promise<ReceiptType[]>;

  findPromocionesActivas(): Promise<any[]>;
  findCantidadComprasCliente(idCliente: string): Promise<number>;

  findPromocionById(id: number): Promise<any | null>;
  findPromocionesActivas(): Promise<any[]>;
  findCantidadComprasCliente(idCliente: string): Promise<number>;
  saveDescuentoAplicado(
    idComprobante: number,
    idPromocion: number,
    monto: number,
  ): Promise<void>;
}
