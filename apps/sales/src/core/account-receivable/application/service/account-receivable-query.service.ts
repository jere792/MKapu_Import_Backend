/* ============================================
   sales/src/core/account-receivable/application/service/account-receivable-query.service.ts
   ============================================ */

import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { AccountReceivable } from '../../domain/entity/account-receivable-domain-entity';
import {
  IAccountReceivableRepository,
  ACCOUNT_RECEIVABLE_REPOSITORY,
  PaginationOptions,
  PaginatedResult,
} from '../../domain/ports/out/account-receivable-port-out';
import {
  IGetAccountReceivableByIdUseCase,
  IGetAllOpenAccountReceivablesUseCase,
} from '../../domain/ports/in/account-receivable-port-in';

@Injectable()
export class AccountReceivableQueryService
  implements
    IGetAccountReceivableByIdUseCase,
    IGetAllOpenAccountReceivablesUseCase
{
  constructor(
    @Inject(ACCOUNT_RECEIVABLE_REPOSITORY)
    private readonly repository: IAccountReceivableRepository,
  ) {}

  async getById(id: number): Promise<AccountReceivable> {
    const account = await this.repository.findById(id);
    if (!account)
      throw new NotFoundException(`AccountReceivable #${id} not found`);
    return account;
  }

  async getAllOpen(
    pagination: PaginationOptions,
  ): Promise<PaginatedResult<AccountReceivable>> {
    return this.repository.findAllOpen(pagination);  
  }
}