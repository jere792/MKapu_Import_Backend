/* apps/sales/src/core/sales-receipt/infrastructure/adapters/out/repository/payment.repository.ts */
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, QueryRunner } from 'typeorm';
import { IPaymentRepositoryPort } from '../../../../domain/ports/out/payment-repository-ports-out';
import { PaymentOrmEntity } from '../../../entity/payment-orm.entity';
import { VoucherOrmEntity } from '../../../entity/voucher-orm.entity';
import { CashMovementOrmEntity } from '../../../entity/cash-movement-orm.entity';

@Injectable()
export class PaymentRepository implements IPaymentRepositoryPort {
  constructor(
    @InjectRepository(PaymentOrmEntity)
    private readonly paymentRepo: Repository<PaymentOrmEntity>,
    @InjectRepository(VoucherOrmEntity)
    private readonly voucherRepo: Repository<VoucherOrmEntity>,
    @InjectRepository(CashMovementOrmEntity)
    private readonly cashRepo: Repository<CashMovementOrmEntity>,
  ) {}

  // Ajustado a Promise<void> para cumplir con la interfaz
  async savePayment(data: Partial<PaymentOrmEntity>): Promise<void> {
    await this.paymentRepo.save(data);
  }

  async registerCashMovement(data: Partial<CashMovementOrmEntity>): Promise<void> {
    await this.cashRepo.save(data);
  }

  async savePaymentInTransaction(data: any, queryRunner: QueryRunner): Promise<void> {
    await queryRunner.manager.save(PaymentOrmEntity, data);
  }

  async registerCashMovementInTransaction(data: any, queryRunner: QueryRunner): Promise<void> {
    await queryRunner.manager.save(CashMovementOrmEntity, data);
  }
}