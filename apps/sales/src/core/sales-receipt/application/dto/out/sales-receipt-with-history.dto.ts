/* apps/sales/src/core/sales-receipt/application/dto/out/sales-receipt-with-history.dto.ts */

import { SalesReceiptResponseDto } from './sales-receipt-response.dto';
import { CustomerPurchaseHistoryDto } from './customer-purchase-history.dto';

export interface SalesReceiptWithHistoryDto {
  receipt: SalesReceiptResponseDto;
  customerHistory?: CustomerPurchaseHistoryDto;
}
