/* sales/src/core/warranty/domain/ports/in/warranty-ports-in.ts */
import { ListWarrantyFilterDto } from '../../../application/dto/in/list-warranty-filter.dto';
import { WarrantyListResponse } from '../../../application/dto/out/warranty-list-response.dto';
import { WarrantyResponseDto } from '../../../application/dto/out/warranty-response.dto';

export interface IWarrantyQueryPort {
  listWarranties(filters: ListWarrantyFilterDto): Promise<WarrantyListResponse>;
  getWarrantyById(id: number): Promise<WarrantyResponseDto | null>;
  getWarrantiesByReceipt(idComprobante: number): Promise<WarrantyResponseDto[]>;
}
