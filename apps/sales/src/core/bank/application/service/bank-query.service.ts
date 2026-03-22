import { Injectable, Inject } from '@nestjs/common';
import { IBankQueryPort } from '../../domain/ports/in/bank-ports-in';
import { IBankRepositoryPort } from '../../domain/ports/out/bank-ports-out';
import {
  BankResponseDto,
  ServiceTypeResponseDto,
} from '../dto/out';
import { BankMapper } from '../mapper/bank.mapper';

@Injectable()
export class BankQueryService implements IBankQueryPort {
  constructor(
    @Inject('IBankRepositoryPort')
    private readonly bankRepository: IBankRepositoryPort,
  ) {}

  async getAllBanks(): Promise<BankResponseDto[]> {
    const banks = await this.bankRepository.findAllBanks();
    return banks.map(BankMapper.toBankResponseDto);
  }

  async getServiceTypes(bancoId?: number): Promise<ServiceTypeResponseDto[]> {
    const types = await this.bankRepository.findServiceTypes(bancoId);
    return types.map(BankMapper.toServiceTypeResponseDto);
  }

}
