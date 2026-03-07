/* ============================================
   sales/src/core/account-receivable/application/mapper/account-receivable.mapper.ts
   ============================================ */

import { Injectable } from '@nestjs/common';
import {
  AccountReceivable,
  AccountReceivableProps,
  AccountReceivableStatus,
  Money,
} from '../../domain/entity/account-receivable-domain-entity';
import { AccountReceivableOrmEntity } from '../../infrastructure/entity/account-receivable-orm.entity';
import { AccountReceivableResponseDto } from '../dto/out/account-receivable-dto-out';

@Injectable()
export class AccountReceivableMapper {

  // ── ORM → Domain ──────────────────────────────────────────────────
  toDomain(orm: AccountReceivableOrmEntity): AccountReceivable {
    const props: AccountReceivableProps = {
      id:             orm.id,
      salesReceiptId: orm.salesReceiptId,
      userRef:        orm.userRef,
      totalAmount:    new Money(Number(orm.totalAmount),         orm.currencyCode),
      paidAmount:     new Money(Number(orm.paidAmount),          orm.currencyCode),
      pendingBalance: new Money(Number(orm.pendingBalance ?? 0), orm.currencyCode),
      issueDate:      orm.issueDate,
      dueDate:        orm.dueDate,
      updatedAt:      orm.updatedAt ?? null,
      status:         orm.status as AccountReceivableStatus,
      paymentTypeId:  orm.paymentTypeId,
      currencyCode:   orm.currencyCode,
      observation:    orm.observation,
    };
    return AccountReceivable.reconstitute(props);
  }

  // ── Domain → ORM ──────────────────────────────────────────────────
  toOrm(domain: AccountReceivable): AccountReceivableOrmEntity {
    const orm = new AccountReceivableOrmEntity();

    if (domain.id) orm.id = domain.id;

    orm.salesReceiptId  = domain.salesReceiptId;
    orm.userRef         = domain.userRef;
    orm.totalAmount     = domain.totalAmount.amount;
    orm.paidAmount      = domain.paidAmount.amount;
    orm.pendingBalance  = domain.pendingBalance.amount;
    orm.issueDate       = domain.issueDate;
    orm.dueDate         = domain.dueDate;
    orm.status          = domain.status;
    orm.paymentTypeId   = domain.paymentTypeId;
    orm.currencyCode    = domain.currencyCode;
    orm.observation     = domain.observation;

    if (domain.id) {
      orm.updatedAt = new Date();
    }

    return orm;
  }

  // ── Domain → ResponseDto ──────────────────────────────────────────
  toResponseDto(domain: AccountReceivable): AccountReceivableResponseDto {
    const dto = new AccountReceivableResponseDto();

    dto.id             = domain.id!;
    dto.salesReceiptId = domain.salesReceiptId;
    dto.userRef        = domain.userRef;
    dto.totalAmount    = domain.totalAmount.amount;
    dto.paidAmount     = domain.paidAmount.amount;
    dto.pendingBalance = domain.pendingBalance.amount;
    dto.issueDate      = domain.issueDate.toISOString();
    dto.dueDate        = domain.dueDate.toISOString();
    dto.updatedAt      = domain.updatedAt?.toISOString() ?? null;
    dto.status         = domain.status;
    dto.paymentTypeId  = domain.paymentTypeId;
    dto.currencyCode   = domain.currencyCode;
    dto.observation    = domain.observation;

    return dto;
  }

  // ── Domain[] → ResponseDto[] ──────────────────────────────────────
  toResponseDtoList(domains: AccountReceivable[]): AccountReceivableResponseDto[] {
    return domains.map((d) => this.toResponseDto(d));
  }
}