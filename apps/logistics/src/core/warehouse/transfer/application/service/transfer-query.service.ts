/*
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Transfer } from '../../domain/entity/transfer-domain-entity';
import { TransferPortsOut } from '../../domain/ports/out/transfer-ports-out';

@Injectable()
export class TransferQueryService implements TransferQueryPortIn {
  constructor(
    @Inject('TransferPortsOut')
    private readonly transferRepo: TransferPortsOut,
  ) {}

  async getTransfersByHeadquarters(
    headquartersId: string,
  ): Promise<Transfer[]> {
    return this.transferRepo.findByHeadquarters(headquartersId);
  }

  async getTransferById(id: number): Promise<Transfer> {
    const transfer = await this.transferRepo.findById(id);
    if (!transfer) {
      throw new NotFoundException(`Transferencia con ID ${id} no encontrada`);
    }
    return transfer;
  }

  async getAllTransfers(): Promise<Transfer[]> {
    return this.transferRepo.findAll();
  }
}
*/