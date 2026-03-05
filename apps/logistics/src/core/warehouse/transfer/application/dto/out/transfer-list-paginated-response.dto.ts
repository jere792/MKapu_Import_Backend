import { TransferListResponseDto } from './transfer-list-response.dto';

export interface TransferListPaginationDto {
  page: number;
  pageSize: number;
  totalRecords: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface TransferListPaginatedResponseDto {
  data: TransferListResponseDto[];
  pagination: TransferListPaginationDto;
}
