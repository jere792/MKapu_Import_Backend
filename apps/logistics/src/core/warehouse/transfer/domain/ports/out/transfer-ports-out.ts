import { EntityManager } from 'typeorm';
import { Transfer, TransferStatus } from '../../entity/transfer-domain-entity';

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
  ): Promise<{ transfers: Transfer[]; total: number }>;
}
