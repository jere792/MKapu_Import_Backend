/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, QueryRunner, DataSource } from 'typeorm'; // 👈 agregar DataSource
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
    private readonly dataSource: DataSource,
  ) {}

  async savePayment(data: Partial<PaymentOrmEntity>): Promise<void> {
    await this.paymentRepo.save(data);
  }

  async registerCashMovement(
    data: Partial<CashMovementOrmEntity>,
  ): Promise<void> {
    await this.cashRepo.save(data);
  }

  async savePaymentInTransaction(
    data: any,
    queryRunner: QueryRunner,
  ): Promise<void> {
    await queryRunner.manager.save(PaymentOrmEntity, data);
  }

  async registerCashMovementInTransaction(
    data: any,
    queryRunner: QueryRunner,
  ): Promise<void> {
    await queryRunner.manager.save(CashMovementOrmEntity, data);
  }

  async findActiveCajaId(idSede: number): Promise<string | null> {
    const result = await this.dataSource.query(
      `SELECT id_caja FROM caja WHERE id_sede_ref = ? AND estado = 'ABIERTA' LIMIT 1`,
      [idSede],
    );
    return result.length > 0 ? result[0].id_caja : null;
  }
}
