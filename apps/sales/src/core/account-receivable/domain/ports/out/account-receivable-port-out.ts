/* ============================================
   sales/src/core/accountreceivable/ports/out/account-receivable-port-out.ts
   ============================================ */

import { AccountReceivable } from '../../entity/account-receivable-domain-entity';

export interface PaginationOptions {
  page:    number;
  limit:   number;
  sedeId?: number; 
}
export interface PaginatedResult<T> {
  data:       T[];
  total:      number;
  page:       number;
  limit:      number;
  totalPages: number;
}

export interface IAccountReceivableRepository {
  findById(id: number): Promise<AccountReceivable | null>;
  findBySalesReceiptId(salesReceiptId: number): Promise<AccountReceivable | null>;
  findAllOpen(pagination: PaginationOptions): Promise<PaginatedResult<AccountReceivable>>;
  findOverdue(): Promise<AccountReceivable[]>;
  save(account: AccountReceivable): Promise<AccountReceivable>;
  update(account: AccountReceivable): Promise<AccountReceivable>;
}

export const ACCOUNT_RECEIVABLE_REPOSITORY =
  Symbol('IAccountReceivableRepository');