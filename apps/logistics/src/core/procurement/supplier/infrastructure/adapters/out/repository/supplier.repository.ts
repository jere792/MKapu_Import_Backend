/* ============================================
   apps/logistics/src/core/procurement/supplier/infrastructure/adapters/out/repository/supplier.repository.ts
   ============================================ */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ISupplierRepositoryPort } from '../../../../domain/ports/out/supplier-ports-out';
import { Supplier } from '../../../../domain/entity/supplier-domain-entity';
import { SupplierOrmEntity } from '../../../entity/supplier-orm.entity';
import { SupplierMapper } from '../../../../application/mapper/supplier.mapper';
import { ListSupplierFilterDto } from '../../../../application/dto/in';

@Injectable()
export class SupplierRepository implements ISupplierRepositoryPort {
  constructor(
    @InjectRepository(SupplierOrmEntity)
    private readonly supplierOrmRepository: Repository<SupplierOrmEntity>,
  ) {}

  async save(supplier: Supplier): Promise<Supplier> {
    const supplierOrm = SupplierMapper.toOrmEntity(supplier);
    const saved       = await this.supplierOrmRepository.save(supplierOrm);
    return SupplierMapper.toDomainEntity(saved);
  }

  async update(supplier: Supplier): Promise<Supplier> {
    const supplierOrm = SupplierMapper.toOrmEntity(supplier);
    await this.supplierOrmRepository.update(supplier.id_proveedor!, supplierOrm);
    const updated = await this.supplierOrmRepository.findOne({
      where: { id_proveedor: supplier.id_proveedor },
    });
    return SupplierMapper.toDomainEntity(updated!);
  }

  async delete(id: number): Promise<void> {
    await this.supplierOrmRepository.delete(id);
  }

  async findById(id: number): Promise<Supplier | null> {
    const orm = await this.supplierOrmRepository.findOne({
      where: { id_proveedor: id },
    });
    return orm ? SupplierMapper.toDomainEntity(orm) : null;
  }

  async findByRuc(ruc: string): Promise<Supplier | null> {
    const orm = await this.supplierOrmRepository.findOne({ where: { ruc } });
    return orm ? SupplierMapper.toDomainEntity(orm) : null;
  }

  // ✅ RESUELTO: usa qb y ListSupplierFilterDto (versión 23c85ddb)
  async findAll(filters?: ListSupplierFilterDto): Promise<Supplier[]> {
    const qb = this.supplierOrmRepository.createQueryBuilder('proveedor');

    if (filters?.estado !== undefined) {
      const estadoBit = filters.estado ? 1 : 0;
      qb.andWhere('proveedor.estado = :estado', { estado: estadoBit });
    }

    if (filters?.search) {
      const search = `%${filters.search.toLowerCase()}%`;
      qb.andWhere(
        '(LOWER(proveedor.razon_social) LIKE :search OR LOWER(proveedor.ruc) LIKE :search OR LOWER(proveedor.contacto) LIKE :search)',
        { search },
      );
    }

    qb.orderBy('proveedor.id_proveedor', 'DESC');

    if (filters?.page && filters?.limit) {
      const page  = filters.page  > 0 ? filters.page  : 1;
      const limit = filters.limit > 0 ? filters.limit : 10;
      const skip  = (page - 1) * limit;
      qb.skip(skip).take(limit);
    }

    const suppliersOrm = await qb.getMany();
    return suppliersOrm.map((s) => SupplierMapper.toDomainEntity(s));
  }

  async existsByRuc(ruc: string): Promise<boolean> {
    const count = await this.supplierOrmRepository.count({ where: { ruc } });
    return count > 0;
  }
}
