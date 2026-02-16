/* apps/sales/src/core/sales-receipt/domain/ports/out/payment-repository-ports-out.ts */

import { QueryRunner } from 'typeorm';

export interface IPaymentRepositoryPort {
  savePayment(data: any): Promise<void>;
  registerCashMovement(data: any): Promise<void>;

  savePaymentInTransaction(data: any, queryRunner: QueryRunner): Promise<void>;
  registerCashMovementInTransaction(data: any, queryRunner: QueryRunner): Promise<void>;
}
