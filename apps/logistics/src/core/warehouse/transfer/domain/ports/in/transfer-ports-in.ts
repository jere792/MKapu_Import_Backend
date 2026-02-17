import { Transfer } from '../../entity/transfer-domain-entity';

export interface RequestTransferItemDto {
  productId: number;
  series: string[];
}

export interface RequestTransferDto {
  originHeadquartersId: string;
  originWarehouseId: number;
  destinationHeadquartersId: string;
  destinationWarehouseId: number;
  items: RequestTransferItemDto[];
  observation?: string;
  userId: number;
}

export interface TransferPortsIn {
  requestTransfer(dto: RequestTransferDto): Promise<Transfer>;

  approveTransfer(transferId: number, userId: number): Promise<Transfer>;

  rejectTransfer(
    transferId: number,
    userId: number,
    reason: string,
  ): Promise<Transfer>;

  confirmReceipt(transferId: number, userId: number): Promise<Transfer>;

  getTransfersByHeadquarters(headquartersId: string): Promise<Transfer[]>;

  getTransferById(id: number): Promise<Transfer>;

  getAllTransfers(): Promise<Transfer[]>;
}
