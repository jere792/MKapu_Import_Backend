import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ISedeAlmacenRepositoryPort } from '../../../../domain/ports/out/sede-almacen-ports-out';
import { SedeAlmacen } from '../../../../domain/entity/sede-almacen-domain-entity';
import { SedeAlmacenOrmEntity } from '../../../entity/sede-almacen-orm.entity';
import { SedeAlmacenMapper } from '../../../../application/mapper/sede-almacen.mapper';

@Injectable()
export class SedeAlmacenRepository implements ISedeAlmacenRepositoryPort {
  constructor(
    @InjectRepository(SedeAlmacenOrmEntity)
    private readonly repo: Repository<SedeAlmacenOrmEntity>,
  ) {}

  async save(entity: SedeAlmacen): Promise<SedeAlmacen> {
    const orm = SedeAlmacenMapper.toOrmEntity(entity);
    const saved = await this.repo.save(orm);
    return SedeAlmacenMapper.toDomainEntity(saved);
  }

  async findBySedeAndWarehouse(id_sede: number, id_almacen: number): Promise<SedeAlmacen | null> {
    const record = await this.repo.findOne({
      where: { id_sede, id_almacen },
      select: ['id_sede', 'id_almacen'],
    });
    return record ? SedeAlmacenMapper.toDomainEntity(record) : null;
  }

  async findByWarehouseId(id_almacen: number): Promise<SedeAlmacen | null> {
    const record = await this.repo.findOne({
      where: { id_almacen },
      select: ['id_sede', 'id_almacen'],
    });
    return record ? SedeAlmacenMapper.toDomainEntity(record) : null;
  }

  async findBySedeId(id_sede: number): Promise<SedeAlmacen[]> {
    const records = await this.repo.find({
      where: { id_sede },
      select: ['id_sede', 'id_almacen'],
    });
    return records.map((r) => SedeAlmacenMapper.toDomainEntity(r));
  }

  async deleteByWarehouseId(id_almacen: number): Promise<void> {
    await this.repo.delete({ id_almacen });
  }
}