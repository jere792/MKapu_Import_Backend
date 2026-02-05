import { WarrantyResponseDto } from './warranty-response.dto';

export class WarrantyListResponse {
  data: WarrantyResponseDto[];
  meta: {
    totalItems: number;
    itemsPerPage: number;
    totalPages: number;
    currentPage: number;
  };
}
