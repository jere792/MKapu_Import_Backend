/* ============================================
   apps/sales/src/core/sales-receipt/domain/ports/out/sales_receipt-ports-out.ts
   ============================================ */

import { QueryRunner } from 'typeorm';
import { SalesReceipt } from '../../entity/sales-receipt-domain-entity';
import { SalesReceiptOrmEntity } from '../../../infrastructure/entity/sales-receipt-orm.entity';
import { SalesReceiptAutocompleteResponseDto } from '../../../application/dto/out';

// ─── FILTROS PAGINADOS ────────────────────────────────────────────────────────

export interface FindAllPaginatedFilters {
  estado?:              string;
  id_cliente?:          string;
  id_tipo_comprobante?: number;
  fec_desde?:           string | Date;
  fec_hasta?:           string | Date;
  search?:              string;
  id_sede?:             number;
  skip:                 number;
  take:                 number;
}

// ─── PORT DE REPOSITORIO ──────────────────────────────────────────────────────

export interface ISalesReceiptRepositoryPort {

  // ── Write ──────────────────────────────────────────────────────────────────
  save(receipt: SalesReceipt): Promise<SalesReceipt>;
  update(receipt: SalesReceipt): Promise<SalesReceipt>;
  delete(id: number): Promise<void>;

  // ── Utils ──────────────────────────────────────────────────────────────────
  getQueryRunner(): QueryRunner;
  getNextNumber(serie: string): Promise<number>;
  getNextNumberWithLock(serie: string, queryRunner: QueryRunner): Promise<number>;

  // ── Read básico (domain) ───────────────────────────────────────────────────
  findById(id: number): Promise<SalesReceipt | null>;
  findBySerie(serie: string): Promise<SalesReceipt[]>;
  findAll(filters?: {
    estado?:              'EMITIDO' | 'ANULADO' | 'RECHAZADO';
    id_cliente?:          string;
    id_tipo_comprobante?: number;
    fec_desde?:           Date;
    fec_hasta?:           Date;
    search?:              string;
    sedeId?:              number;
    page?:                number;
    limit?:               number;
  }): Promise<SalesReceipt[]>;

  // ── Read con relaciones ORM ────────────────────────────────────────────────
  findByIdWithRelations(id: number): Promise<SalesReceiptOrmEntity | null>;         // ✅ nuevo
  findByIdWithFullRelations(id: number): Promise<SalesReceiptOrmEntity | null>;     // ✅ nuevo
  findBySerieWithRelations(serie: string): Promise<SalesReceiptOrmEntity[]>;        // ✅ nuevo

  // ── Paginado enriquecido ───────────────────────────────────────────────────
  findAllWithRelations(                                                              // ✅ nuevo
    filters: FindAllPaginatedFilters,
  ): Promise<{ receipts: SalesReceiptOrmEntity[]; total: number }>;

  // ── Historial de cliente ───────────────────────────────────────────────────
  findCustomerPurchaseHistory(customerId: string): Promise<{                        // ✅ nuevo
    customer: any;
    statistics: {
      totalCompras:   number;
      totalEmitidos:  number;
      totalAnulados:  number;
      montoTotal:     number;
      montoEmitido:   number;
      promedioCompra: number;
    };
    recentPurchases: SalesReceiptOrmEntity[];
  }>;

  // ── Autocomplete ───────────────────────────────────────────────────────────
  autocompleteCustomers(
    search: string,
    sedeId?: number,
  ): Promise<SalesReceiptAutocompleteResponseDto[]>;
}
