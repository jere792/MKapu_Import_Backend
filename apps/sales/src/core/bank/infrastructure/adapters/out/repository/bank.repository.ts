import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import {
  IBankRepositoryPort,
} from '../../../../domain/ports/out/bank-ports-out';
import { Bank } from '../../../../domain/entity/bank-domain-entity';
import { ServiceType } from '../../../../domain/entity/service-type-domain-entity';
import { BankOrmEntity } from '../../../entity/bank-orm.entity';
import { ServiceTypeOrmEntity } from '../../../entity/service-type-orm.entity';
import { BankMapper } from '../../../../application/mapper/bank.mapper';

@Injectable()
export class BankRepository implements IBankRepositoryPort {
  constructor(
    @InjectRepository(BankOrmEntity)
    private readonly bankRepo: Repository<BankOrmEntity>,

    @InjectRepository(ServiceTypeOrmEntity)
    private readonly serviceTypeRepo: Repository<ServiceTypeOrmEntity>,

    private readonly dataSource: DataSource,
  ) {}

  async findAllBanks(): Promise<Bank[]> {
    const rows = await this.bankRepo.find({ order: { nombre_banco: 'ASC' } });
    return rows.map(BankMapper.toDomainBank);
  }

  async findServiceTypes(bancoId?: number): Promise<ServiceType[]> {
    const where = bancoId ? { id_banco: bancoId } : {};
    const rows = await this.serviceTypeRepo.find({
      where,
      order: { nombre_servicio: 'ASC' },
    });
    return rows.map(BankMapper.toDomainServiceType);
  }

}
