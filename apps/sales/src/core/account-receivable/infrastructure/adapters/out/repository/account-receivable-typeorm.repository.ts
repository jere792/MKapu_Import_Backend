/* ============================================
   sales/src/core/account-receivable/infrastructure/adapters/out/repository/account-receivable-typeorm.repository.ts
   ============================================ */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Not, In, Repository } from 'typeorm';
import {
  AccountReceivable,
  AccountReceivableStatus,
} from '../../../../domain/entity/account-receivable-domain-entity';
import { AccountReceivableOrmEntity }  from '../../../entity/account-receivable-orm.entity';
import { AccountReceivableMapper }     from '../../../../application/mapper/account-receivable.mapper';
import {
  IAccountReceivableRepository,
  PaginationOptions,
  PaginatedResult,
} from '../../../../domain/ports/out/account-receivable-port-out';

@Injectable()
export class AccountReceivableTypeormRepository
  implements IAccountReceivableRepository
{
  constructor(
    @InjectRepository(AccountReceivableOrmEntity)
    private readonly ormRepo: Repository<AccountReceivableOrmEntity>,
    private readonly mapper:  AccountReceivableMapper,
  ) {}

  // ── Buscar por id ────────────────────────────────────────────────
  async findById(id: number): Promise<AccountReceivable | null> {
    const orm = await this.ormRepo.findOne({
      where: { id },
      relations: ['paymentType', 'currency'],
    });
    return orm ? this.mapper.toDomain(orm) : null;
  }

  // ── Buscar por comprobante de venta ──────────────────────────────
  async findBySalesReceiptId(
    salesReceiptId: number,
  ): Promise<AccountReceivable | null> {
    const orm = await this.ormRepo.findOne({
      where: { salesReceiptId },
      relations: ['paymentType', 'currency'],
    });
    return orm ? this.mapper.toDomain(orm) : null;
  }

  // ── Paginado con filtros opcionales ───────────────────────────────
  async findAllOpen(
    pagination: PaginationOptions,
  ): Promise<PaginatedResult<AccountReceivable>> {
    const { page, limit, sedeId, status } = pagination;
    const skip = (page - 1) * limit;

    const qb = this.ormRepo
      .createQueryBuilder('ar')
      .leftJoinAndSelect('ar.paymentType', 'paymentType')
      .leftJoinAndSelect('ar.currency', 'currency')
      .innerJoin('ar.salesReceipt', 'sr');

    // Si viene status filtra por ese estado; si no, devuelve TODOS
    if (status) {
      qb.where('ar.status = :status', { status });
    }

    if (sedeId) {
      qb.andWhere('sr.id_sede_ref = :sedeId', { sedeId });
    }

    qb.orderBy('ar.dueDate', 'ASC')
      .skip(skip)
      .take(limit);

    const [orms, total] = await qb.getManyAndCount();

    return {
      data: orms.map((o) => this.mapper.toDomain(o)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOverdue(): Promise<AccountReceivable[]> {
    const orms = await this.ormRepo.find({
      where: {
        dueDate: LessThan(new Date()),
        status:  Not(In([
          AccountReceivableStatus.PAGADO,
          AccountReceivableStatus.CANCELADO,
        ])),
      },
      relations: ['paymentType', 'currency'],
    });
    return orms.map((o) => this.mapper.toDomain(o));
  }

  // ── Guardar nueva ─────────────────────────────────────────────────
  async save(account: AccountReceivable): Promise<AccountReceivable> {
    const orm   = this.mapper.toOrm(account);
    const saved = await this.ormRepo.save(orm);
    return this.mapper.toDomain(saved);
  }

  // ── Actualizar existente ──────────────────────────────────────────
  async update(account: AccountReceivable): Promise<AccountReceivable> {
    const orm     = this.mapper.toOrm(account);
    const updated = await this.ormRepo.save(orm);
    return this.mapper.toDomain(updated);
  }
}