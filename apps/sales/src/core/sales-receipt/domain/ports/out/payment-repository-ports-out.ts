import { QueryRunner } from 'typeorm';

export interface IPaymentRepositoryPort {
  savePayment(data: any): Promise<void>;
  registerCashMovement(data: any): Promise<void>;
  findActiveCajaId(idSede: number): Promise<string | null>;
  savePaymentInTransaction(data: any, queryRunner: QueryRunner): Promise<void>;
  registerCashMovementInTransaction(data: any, queryRunner: QueryRunner): Promise<void>;
}