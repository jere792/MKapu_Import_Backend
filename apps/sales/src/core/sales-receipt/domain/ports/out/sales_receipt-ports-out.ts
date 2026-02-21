import { QueryRunner } from 'typeorm'; // Importante para la transacción
import { SalesReceipt } from '../../entity/sales-receipt-domain-entity';
import { SalesReceiptOrmEntity } from '../../../infrastructure/entity/sales-receipt-orm.entity';

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
    fec_desde?: Date;
    fec_hasta?: Date;
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
}
