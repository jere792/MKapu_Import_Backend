import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, In, Repository } from 'typeorm';
import { IWarehouseRepository } from '../../../../domain/ports/out/warehouse-ports-out';
import { Warehouse } from '../../../../domain/entity/warehouse-domain-entity';
import { WarehouseOrmEntity } from '../../../entity/warehouse-orm.entity';
import { WarehouseMapper } from '../../../../application/mapper/warehouse-mapper';
import { ListWarehousesFilterDto } from '../../../../application/dto/in/list-warehouses-filter.dto';
import { WarehouseListResponse } from '../../../../application/dto/out/warehouse-list-response.dto';

@Injectable()
export class WarehouseTypeormRepository implements IWarehouseRepository {
  constructor(
    @InjectRepository(WarehouseOrmEntity)
    private readonly repo: Repository<WarehouseOrmEntity>,
  ) {}

  async findPaginated(filters: ListWarehousesFilterDto): Promise<WarehouseListResponse> {
    const page     = Math.max(1, Number(filters.page)     || 1);
    const pageSize = Math.min(1000, Math.max(1, Number(filters.pageSize) || 10));

    const qb = this.repo.createQueryBuilder('w');

    if (filters.search) {
      qb.andWhere(
        '(w.nombre LIKE :search OR w.codigo LIKE :search OR w.ciudad LIKE :search OR w.departamento LIKE :search)',
        { search: `%${filters.search}%` },
      );
    }

    if (filters.activo !== undefined) {
      qb.andWhere('w.activo = :activo', { activo: filters.activo });
    }

    const [items, total] = await qb
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    return WarehouseMapper.toPaginatedResponse(items, total, page, pageSize);
  }

  async findById(id: number): Promise<Warehouse | null> {
    const e = await this.repo.findOne({ where: { id_almacen: id } });
    return e ? WarehouseMapper.fromOrm(e) : null;
  }

  async findByIds(ids: number[]): Promise<Warehouse[]> {
    if (!ids || ids.length === 0) return [];
    const uniqueIds = Array.from(new Set(ids.map((id) => Number(id)).filter((id) => id > 0)));
    if (uniqueIds.length === 0) return [];
    const entities = await this.repo.find({
      where: { id_almacen: In(uniqueIds) },
    });
    return entities.map((e) => WarehouseMapper.fromOrm(e));
  }

  async findByCode(code: string): Promise<Warehouse | null> {
    const e = await this.repo.findOne({ where: { codigo: code } });
    return e ? WarehouseMapper.fromOrm(e) : null;
  }

  async create(w: Warehouse): Promise<Warehouse> {
    const ormPartial: DeepPartial<WarehouseOrmEntity> = WarehouseMapper.toOrm(w) as DeepPartial<WarehouseOrmEntity>;
    const orm = this.repo.create(ormPartial);
    const saved = await this.repo.save(orm);
    return WarehouseMapper.fromOrm(saved);
  }

  async update(id: number, partial: Partial<Warehouse>): Promise<Warehouse> {
    const existing = await this.repo.findOne({ where: { id_almacen: id } });
    if (!existing) throw new Error('Almacén no encontrado');
    const merged = this.repo.merge(existing, partial as any);
    const saved = await this.repo.save(merged);
    return WarehouseMapper.fromOrm(saved);
  }

  async delete(id: number): Promise<void> {
    await this.repo.delete(id);
  }
}