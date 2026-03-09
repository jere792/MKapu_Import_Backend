/* ============================================
   sales/src/core/account-receivable/application/service/account-receivable-command.service.ts
   ============================================ */

import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  AccountReceivable,
  Money,
} from '../../../domain/entity/account-receivable-domain-entity';
import {
  IAccountReceivableRepository,
  ACCOUNT_RECEIVABLE_REPOSITORY,
} from '../../../domain/ports/out/account-receivable-port-out';
import {
  ICreateAccountReceivableUseCase,
  CreateAccountReceivableCommand,
  IApplyPaymentUseCase,
  ApplyPaymentCommand,
  ICancelAccountReceivableUseCase,
  CancelAccountReceivableCommand,
  IUpdateDueDateUseCase,
  UpdateDueDateCommand,
  ICheckExpirationUseCase,
} from '../../../domain/ports/in/account-receivable-port-in';

@Injectable()
export class AccountReceivableCommandService
  implements
    ICreateAccountReceivableUseCase,
    IApplyPaymentUseCase,
    ICancelAccountReceivableUseCase,
    IUpdateDueDateUseCase,
    ICheckExpirationUseCase
{
  constructor(
    @Inject(ACCOUNT_RECEIVABLE_REPOSITORY)
    private readonly repository: IAccountReceivableRepository,
  ) {}

  // ── Crear cuenta por cobrar ─────────────────────────────────────
  async create(cmd: CreateAccountReceivableCommand): Promise<AccountReceivable> {
    const account = AccountReceivable.create({
      salesReceiptId: cmd.salesReceiptId,
      userRef:        cmd.userRef,
      totalAmount:    new Money(cmd.totalAmount, cmd.currencyCode),
      dueDate:        new Date(cmd.dueDate),
      paymentTypeId:  cmd.paymentTypeId,
      currencyCode:   cmd.currencyCode,
      observation:    cmd.observation,
    });
    return this.repository.save(account);
  }

  // ── Registrar abono ─────────────────────────────────────────────
  async applyPayment(cmd: ApplyPaymentCommand): Promise<AccountReceivable> {
    const account = await this.findOrFail(cmd.accountReceivableId);
    account.applyPayment(new Money(cmd.amount, cmd.currencyCode));
    account.updatePaymentType(cmd.paymentTypeId); // ← usa el método del dominio
    return this.repository.update(account);
  }

  // ── Cancelar ────────────────────────────────────────────────────
  async cancel(cmd: CancelAccountReceivableCommand): Promise<AccountReceivable> {
    const account = await this.findOrFail(cmd.accountReceivableId);
    account.cancel(cmd.reason);
    return this.repository.update(account);
  }

  // ── Actualizar fecha de vencimiento ─────────────────────────────
  async updateDueDate(cmd: UpdateDueDateCommand): Promise<AccountReceivable> {
    const account = await this.findOrFail(cmd.accountReceivableId);
    account.updateDueDate(new Date(cmd.newDueDate));
    return this.repository.update(account);
  }

  // ── Verificar vencimientos (cron) ───────────────────────────────
  async checkExpiration(): Promise<void> {
    const overdue = await this.repository.findOverdue();
    for (const account of overdue) {
      account.checkExpiration();
      await this.repository.update(account);
    }
  }

  // ── Helper ──────────────────────────────────────────────────────
  private async findOrFail(id: number): Promise<AccountReceivable> {
    const account = await this.repository.findById(id);
    if (!account)
      throw new NotFoundException(`AccountReceivable #${id} not found`);
    return account;
  }
}