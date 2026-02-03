/* ============================================
   INFRASTRUCTURE LAYER - REPOSITORY
   logistics/src/core/catalog/product/infrastructure/adapters/product-typeorm.repository.ts
   ============================================ */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { IProductRepositoryPort } from '../../../../domain/ports/out/product-ports-out';
import { Product } from '../../../../domain/entity/product-domain-entity';
import { ProductOrmEntity } from '../../../entity/product-orm.entity';
import { ProductMapper } from '../../../../application/mapper/product.mapper';
import { ListProductFilterDto } from '../../../../application/dto/in';

@Injectable()
export class ProductTypeOrmRepository implements IProductRepositoryPort {
  constructor(
    @InjectRepository(ProductOrmEntity)
    private readonly repository: Repository<ProductOrmEntity>,
  ) {}

  // ===============================
  // Commands
  // ===============================

  async save(product: Product): Promise<Product> {
    const ormEntity = ProductMapper.toOrmEntity(product);
    const saved = await this.repository.save(ormEntity);
    return ProductMapper.toDomainEntity(saved);
  }

  async update(product: Product): Promise<Product> {
    const ormEntity = ProductMapper.toOrmEntity(product);
    const saved = await this.repository.save(ormEntity);
    return ProductMapper.toDomainEntity(saved);
  }

  /**
   * Borrado Lógico: Solo cambia el estado a inactivo
   */
  async delete(id: number): Promise<void> {
    await this.repository.update(id, { estado: false });
  }

  // ===============================
  // Queries
  // ===============================

  async findById(id: number): Promise<Product | null> {
    const found = await this.repository.findOne({
      where: { id_producto: id },
      relations: ['categoria'],
    });
    if (!found) return null;
    return ProductMapper.toDomainEntity(found);
  }

  /**
   * Implementación de paginación 5x5 y búsqueda por coincidencia
   */
  async findAll(filters?: ListProductFilterDto): Promise<[Product[], number]> {
    const qb = this.repository.createQueryBuilder('p')
      .leftJoinAndSelect('p.categoria', 'c');

    // Filtros de búsqueda
    if (filters?.estado !== undefined) {
      qb.andWhere('p.estado = :estado', { estado: filters.estado });
    }

    if (filters?.id_categoria) {
      qb.andWhere('p.id_categoria = :id_categoria', { id_categoria: filters.id_categoria });
    }

    if (filters?.search) {
      qb.andWhere(
        '(p.codigo LIKE :search OR p.descripcion LIKE :search OR p.anexo LIKE :search)',
        { search: `%${filters.search}%` },
      );
    }

    // Lógica de Paginación (5 registros por página)
    const limit = filters?.limit || 5;
    const page = filters?.page || 1;
    const skip = (page - 1) * limit;

    qb.skip(skip).take(limit);
    qb.orderBy('p.fec_creacion', 'DESC');

    // getManyAndCount devuelve [entidades, total_registros]
    const [results, total] = await qb.getManyAndCount();
    
    return [
      results.map(ProductMapper.toDomainEntity),
      total
    ];
  }

  async findByCode(codigo: string): Promise<Product | null> {
    const found = await this.repository.findOne({
      where: { codigo },
      relations: ['categoria'],
    });
    if (!found) return null;
    return ProductMapper.toDomainEntity(found);
  }

  async findByCategory(id_categoria: number): Promise<Product[]> {
    const results = await this.repository.find({
      where: { categoria: { id_categoria } },
      relations: ['categoria'],
    });
    return results.map(ProductMapper.toDomainEntity);
  }

  async existsByCode(codigo: string): Promise<boolean> {
    const count = await this.repository.count({ where: { codigo } });
    return count > 0;
  }
}