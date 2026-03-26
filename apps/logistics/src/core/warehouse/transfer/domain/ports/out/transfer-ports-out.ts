import { EntityManager } from 'typeorm';
import { Transfer, TransferStatus } from '../../entity/transfer-domain-entity';

export type TransferListSummary = {
  id: number;
  creatorUserId?: number;
  approveUserId?: number;
  originHeadquartersId: string;
  originWarehouseId: number;
  destinationHeadquartersId: string;
  destinationWarehouseId: number;
  firstProductId?: number;
  totalQuantity: number;
  status: TransferStatus;
  observation?: string;
  requestDate: Date | null;
};

export interface TransferPortsOut {
  save(transfer: Transfer, manager?: EntityManager): Promise<Transfer>;

  findById(id: number): Promise<Transfer | null>;

  updateStatus(id: number, status: TransferStatus): Promise<void>;

  findByHeadquarters(headquartersId: string): Promise<Transfer[]>;

  findNotificationCandidatesByHeadquarters(
    headquartersId: string,
  ): Promise<Transfer[]>;

  findAll(): Promise<Transfer[]>;

  findAllPaginated(
    page: number,
    pageSize: number,
    headquartersId: string,
    dateFrom?: Date,
    dateTo?: Date,
  ): Promise<{ transfers: TransferListSummary[]; total: number }>;
}
