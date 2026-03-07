/* ============================================
   sales/src/core/account-receivable/application/dto/in/account-receivable-dto-in.ts
   ============================================ */

import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Length,
  Matches,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

// ── Paginado ──────────────────────────────────────────────────────────────────
export class PaginationDto {

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  sedeId?: number;  
}

// ── Crear cuenta por cobrar ───────────────────────────────────────────────────
export class CreateAccountReceivableDto {

  @IsInt()
  @IsPositive()
  salesReceiptId: number;

  @IsString()
  @IsNotEmpty()
  @Length(1, 255)
  userRef: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  totalAmount: number;

  @IsDateString()
  dueDate: string;

  @IsInt()
  @IsPositive()
  paymentTypeId: number;

  @IsString()
  @Length(3, 3)
  @Matches(/^[A-Z]{3}$/, { message: 'currencyCode must be a 3-letter ISO 4217 code (e.g. PEN, USD)' })
  currencyCode: string;

  @IsOptional()
  @IsString()
  observation?: string | null;
}

// ── Registrar abono ───────────────────────────────────────────────────────────
export class ApplyPaymentDto {

  @IsInt()
  @IsPositive()
  accountReceivableId: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount: number;

  @IsString()
  @Length(3, 3)
  @Matches(/^[A-Z]{3}$/, { message: 'currencyCode must be a 3-letter ISO 4217 code' })
  currencyCode: string;

  @IsInt()         
  @IsPositive()
  paymentTypeId: number;
}

// ── Cancelar cuenta ───────────────────────────────────────────────────────────
export class CancelAccountReceivableDto {

  @IsInt()
  @IsPositive()
  accountReceivableId: number;

  @IsOptional()
  @IsString()
  reason?: string;
}

// ── Actualizar fecha de vencimiento ───────────────────────────────────────────
export class UpdateDueDateDto {

  @IsInt()
  @IsPositive()
  accountReceivableId: number;

  @IsDateString()
  newDueDate: string;
}