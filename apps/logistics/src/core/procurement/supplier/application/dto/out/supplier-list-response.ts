
// logistics/src/core/procurement/supplier/application/dto/out/supplier-list-response.ts
import { SupplierResponseDto } from './supplier-response-dto';

export interface SupplierListResponse {
  suppliers: SupplierResponseDto[];
  total: number;
}
