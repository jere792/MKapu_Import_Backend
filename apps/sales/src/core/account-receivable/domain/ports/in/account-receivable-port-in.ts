/* ============================================
   sales/src/core/account-receivable/domain/ports/in/account-receivable-port-in.ts
   ============================================ */

import { AccountReceivable } from "../../entity/account-receivable-domain-entity";
import { PaginatedResult, PaginationOptions } from '../out/account-receivable-port-out';

// ── Crear cuenta por cobrar ───────────────────────────────────────────────────
export interface CreateAccountReceivableCommand {
  salesReceiptId: number;
  userRef:        string;
  totalAmount:    number;
  dueDate:        string;
  paymentTypeId:  number;
  currencyCode:   string;
  observation?:   string | null;
}

export interface ICreateAccountReceivableUseCase {
  create(command: CreateAccountReceivableCommand): Promise<AccountReceivable>;
}

export const CREATE_ACCOUNT_RECEIVABLE_USE_CASE =
  Symbol('ICreateAccountReceivableUseCase');

// ── Registrar abono ───────────────────────────────────────────────────────────
export interface ApplyPaymentCommand {
  accountReceivableId: number;
  amount:              number;
  currencyCode:        string;
  paymentTypeId:       number;  
}

export interface IApplyPaymentUseCase {
  applyPayment(command: ApplyPaymentCommand): Promise<AccountReceivable>;
}

export const APPLY_PAYMENT_USE_CASE =
  Symbol('IApplyPaymentUseCase');

// ── Cancelar cuenta ───────────────────────────────────────────────────────────
export interface CancelAccountReceivableCommand {
  accountReceivableId: number;
  reason?:             string;
}

export interface ICancelAccountReceivableUseCase {
  cancel(command: CancelAccountReceivableCommand): Promise<AccountReceivable>;
}

export const CANCEL_ACCOUNT_RECEIVABLE_USE_CASE =
  Symbol('ICancelAccountReceivableUseCase');

// ── Actualizar fecha de vencimiento ───────────────────────────────────────────
export interface UpdateDueDateCommand {
  accountReceivableId: number;
  newDueDate:          string;
}

export interface IUpdateDueDateUseCase {
  updateDueDate(command: UpdateDueDateCommand): Promise<AccountReceivable>;
}

export const UPDATE_DUE_DATE_USE_CASE =
  Symbol('IUpdateDueDateUseCase');

// ── Consultar por id ──────────────────────────────────────────────────────────
export interface IGetAccountReceivableByIdUseCase {
  getById(id: number): Promise<AccountReceivable>;
}

export const GET_ACCOUNT_RECEIVABLE_BY_ID_USE_CASE =
  Symbol('IGetAccountReceivableByIdUseCase');

// ── Consultar paginado ────────────────────────────────────────────────────────
export interface IGetAllOpenAccountReceivablesUseCase {
  getAllOpen(pagination: PaginationOptions): Promise<PaginatedResult<AccountReceivable>>;
}

export const GET_ALL_OPEN_ACCOUNT_RECEIVABLES_USE_CASE =
  Symbol('IGetAllOpenAccountReceivablesUseCase');

// ── Verificar vencimientos (cron) ─────────────────────────────────────────────
export interface ICheckExpirationUseCase {
  checkExpiration(): Promise<void>;
}

export const CHECK_EXPIRATION_USE_CASE =
  Symbol('ICheckExpirationUseCase');