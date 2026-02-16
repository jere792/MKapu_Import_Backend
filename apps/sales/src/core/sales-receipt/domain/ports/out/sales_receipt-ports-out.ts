/* apps/sales/src/core/sales-receipt/domain/ports/out/sales_receipt-ports-out.ts */

import { QueryRunner } from 'typeorm';
import { SalesReceipt } from '../../entity/sales-receipt-domain-entity';
import { SalesReceiptOrmEntity } from '../../../infrastructure/entity/sales-receipt-orm.entity';

export interface ISalesReceiptRepositoryPort {
  save(receipt: SalesReceipt): Promise<SalesReceipt>;
  update(receipt: SalesReceipt): Promise<SalesReceipt>;
  delete(id: number): Promise<void>;
  findById(id: number): Promise<SalesReceipt | null>;
  findBySerie(serie: string): Promise<SalesReceipt[]>;
  findAll(filters: FindAllPaginatedFilters): Promise<{ receipts: SalesReceipt[]; total: number }>;
  getNextNumber(serie: string): Promise<number>;

  getQueryRunner(): QueryRunner;
  getNextNumberWithLock(serie: string, queryRunner: QueryRunner): Promise<number>;

  findByIdWithRelations(id: number): Promise<SalesReceiptOrmEntity | null>;
  findBySerieWithRelations(serie: string): Promise<SalesReceiptOrmEntity[]>;
  findAllWithRelations(filters: FindAllPaginatedFilters): Promise<{
    receipts: SalesReceiptOrmEntity[];
    total: number;
  }>;

  // 🆕 NUEVO
  findByIdWithFullRelations(id: number): Promise<SalesReceiptOrmEntity | null>;

  // 🆕 NUEVO
  findCustomerPurchaseHistory(customerId: string): Promise<{
    customer: any;
    statistics: {
      totalCompras: number;
      totalEmitidos: number;
      totalAnulados: number;
      montoTotal: number;
      montoEmitido: number;
    };
    recentPurchases: SalesReceiptOrmEntity[];
  }>;
}

export type FindAllPaginatedFilters = {
  estado?: 'EMITIDO' | 'ANULADO' | 'RECHAZADO';
  id_cliente?: string;
  id_tipo_comprobante?: number;
  fec_desde?: Date;
  fec_hasta?: Date;
  search?: string;
  id_sede?: number;
  skip: number;
  take: number;
};
