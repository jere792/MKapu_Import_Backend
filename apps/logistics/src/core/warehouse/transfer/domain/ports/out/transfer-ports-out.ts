/* eslint-disable prettier/prettier */
import { Transfer, TransferStatus } from "../../entity/transfer-domain-entity";

export interface TransferPortsOut {
  save(transfer: Transfer): Promise<Transfer>;

  findById(id: number): Promise<Transfer | null>;

  updateStatus(id: number, status: TransferStatus): Promise<void>;

  findByHeadquarters(headquartersId: string): Promise<Transfer[]>;

  findAll(): Promise<Transfer[]>;
}
