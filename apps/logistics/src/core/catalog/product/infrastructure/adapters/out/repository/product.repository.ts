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

  async delete(id: number): Promise<void> {
    await this.repository.delete(id);
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

  async findAll(filters?: ListProductFilterDto): Promise<Product[]> {
    const qb = this.repository.createQueryBuilder('p')
      .leftJoinAndSelect('p.categoria', 'c');

    if (filters?.estado !== undefined) {
      qb.andWhere('p.estado = :estado', { estado: filters.estado });
    }

    if (filters?.id_categoria) {
      qb.andWhere('p.id_categoria = :id_categoria', { id_categoria: filters.id_categoria });
    }

    if (filters?.search) {
      qb.andWhere(
        '(p.codigo LIKE :search OR p.descripcion LIKE :search)',
        { search: `%${filters.search}%` },
      );
    }

    const results = await qb.getMany();
    return results.map(ProductMapper.toDomainEntity);
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
