// list-sales-receipt-filter.dto.ts

import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class ListSalesReceiptFilterDto {
  @IsOptional()
  @IsEnum(['EMITIDO', 'ANULADO', 'RECHAZADO'])
  status?: 'EMITIDO' | 'ANULADO' | 'RECHAZADO';

  @IsOptional()
  @IsString()
  customerId?: string;

  @IsOptional()
  @IsNumber()
  receiptTypeId?: number;

  @IsOptional()
  @IsNumber()
  paymentMethodId?: number;

  @IsOptional()
  dateFrom?: Date | string;   

  @IsOptional()
  dateTo?: Date | string;    

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsNumber()
  sedeId?: number;

  @IsOptional()
  @IsNumber()
  page?: number;

  @IsOptional()
  @IsNumber()
  limit?: number;
}
