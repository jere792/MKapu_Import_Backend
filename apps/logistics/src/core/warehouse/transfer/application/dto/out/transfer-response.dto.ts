import { TransferStatus } from '../../../domain/entity/transfer-domain-entity';

export interface TransferItemResponseDto {
  productId: number;
  series: string[];
  quantity: number;
}

export interface TransferResponseDto {
  id?: number;
  creatorUserId?: number;
  approveUserId?: number;
  creatorUserName?: string;
  creatorUserLastName?: string;
  originHeadquartersId: string;
  originWarehouseId: number;
  destinationHeadquartersId: string;
  destinationWarehouseId: number;
  items: TransferItemResponseDto[];
  totalQuantity: number;
  status: TransferStatus;
  observation?: string;
  requestDate: Date;
  responseDate?: Date;
  completionDate?: Date;
}
