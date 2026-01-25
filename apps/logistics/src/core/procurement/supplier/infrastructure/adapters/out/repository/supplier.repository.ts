
/* ============================================
   logistics/src/core/procurement/supplier/infrastructure/adapters/out/repository/supplier.repository.ts
   ============================================ */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ISupplierRepositoryPort } from '../../../../domain/ports/out/supplier-ports-out';
import { Supplier } from '../../../../domain/entity/supplier-domain-entity';
import { SupplierOrmEntity } from '../../../entity/supplier-orm.entity';
import { SupplierMapper } from '../../../../application/mapper/supplier.mapper';

@Injectable()
export class SupplierRepository implements ISupplierRepositoryPort {
  constructor(
    @InjectRepository(SupplierOrmEntity)
    private readonly supplierOrmRepository: Repository<SupplierOrmEntity>,
  ) {}

  async save(supplier: Supplier): Promise<Supplier> {
    const supplierOrm = SupplierMapper.toOrmEntity(supplier);
    const saved = await this.supplierOrmRepository.save(supplierOrm);
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
    const supplierOrm = await this.supplierOrmRepository.findOne({
      where: { id_proveedor: id },
    });
    return supplierOrm ? SupplierMapper.toDomainEntity(supplierOrm) : null;
  }

  async findByRuc(ruc: string): Promise<Supplier | null> {
    const supplierOrm = await this.supplierOrmRepository.findOne({
      where: { ruc },
    });
    return supplierOrm ? SupplierMapper.toDomainEntity(supplierOrm) : null;
  }

  async findAll(filters?: {
    estado?: boolean;
    search?: string;
  }): Promise<Supplier[]> {
    const queryBuilder = this.supplierOrmRepository.createQueryBuilder('proveedor');

    if (filters?.estado !== undefined) {
      queryBuilder.andWhere('proveedor.estado = :estado', {
        estado: filters.estado,
      });
    }

    if (filters?.search) {
      queryBuilder.andWhere(
        '(proveedor.razon_social LIKE :search OR proveedor.ruc LIKE :search OR proveedor.contacto LIKE :search)',
        { search: `%${filters.search}%` },
      );
    }

    const suppliersOrm = await queryBuilder.getMany();
    return suppliersOrm.map((s) => SupplierMapper.toDomainEntity(s));
  }

  async existsByRuc(ruc: string): Promise<boolean> {
    const count = await this.supplierOrmRepository.count({ where: { ruc } });
    return count > 0;
  }
}
