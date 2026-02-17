/* ============================================
   INFRASTRUCTURE LAYER - REPOSITORY
   logistics/src/core/catalog/product/infrastructure/adapters/out/repository/product-typeorm.repository.ts
   ============================================ */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Brackets } from 'typeorm';

import { IProductRepositoryPort } from '../../../../domain/ports/out/product-ports-out';
import { Product } from '../../../../domain/entity/product-domain-entity';
import { ProductOrmEntity } from '../../../entity/product-orm.entity';
import { StockOrmEntity } from '../../../entity/stock-orm.entity';
import { ProductMapper } from '../../../../application/mapper/product.mapper';
import {
  ListProductFilterDto,
  ListProductStockFilterDto,
  ProductAutocompleteQueryDto,
} from '../../../../application/dto/in';

@Injectable()
export class ProductTypeOrmRepository implements IProductRepositoryPort {
  constructor(
    @InjectRepository(ProductOrmEntity)
    private readonly repository: Repository<ProductOrmEntity>,

    @InjectRepository(StockOrmEntity)
    private readonly stockRepository: Repository<StockOrmEntity>,
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
    const qb = this.repository
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.categoria', 'c');

    if (filters?.estado !== undefined) {
      qb.andWhere('p.estado = :estado', { estado: filters.estado });
    }

    if (filters?.id_categoria) {
      qb.andWhere('p.id_categoria = :id_categoria', {
        id_categoria: filters.id_categoria,
      });
    }

    if (filters?.search) {
      qb.andWhere(
        '(p.codigo LIKE :search OR p.descripcion LIKE :search OR p.anexo LIKE :search)',
        { search: `%${filters.search}%` },
      );
    }

    const limit = filters?.limit || 5;
    const page = filters?.page || 1;
    const skip = (page - 1) * limit;

    qb.skip(skip).take(limit);
    qb.orderBy('p.fec_creacion', 'DESC');

    const [results, total] = await qb.getManyAndCount();

    return [results.map(ProductMapper.toDomainEntity), total];
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

  // ===============================
  // Query para Stock por Sede (paginado + filtros)
  // ===============================

  async findProductsStock(
    filters: ListProductStockFilterDto,
    page: number,
    size: number,
  ): Promise<[StockOrmEntity[], number]> {
    const { id_sede, codigo, nombre, id_categoria, categoria, activo } = filters;

    const queryBuilder = this.stockRepository
      .createQueryBuilder('stock')
      .leftJoinAndSelect('stock.producto', 'producto')
      .leftJoinAndSelect('producto.categoria', 'categoria')
      .where('stock.id_sede = :id_sede', { id_sede: String(id_sede) });

    if (codigo) {
      queryBuilder.andWhere('producto.codigo = :codigo', { codigo });
    }

    if (nombre) {
      queryBuilder.andWhere('producto.anexo LIKE :nombre', {
        nombre: `%${nombre}%`,
      });
    }

    if (id_categoria) {
      queryBuilder.andWhere('producto.id_categoria = :id_categoria', {
        id_categoria,
      });
    }

    if (categoria) {
      queryBuilder.andWhere('categoria.nombre LIKE :categoria', {
        categoria: `%${categoria}%`,
      });
    }

    if (activo !== undefined) {
      queryBuilder.andWhere('producto.estado = :activo', { activo });
    }

    queryBuilder.skip((page - 1) * size).take(size);
    queryBuilder.orderBy('producto.id_producto', 'ASC');

    return await queryBuilder.getManyAndCount();
  }

  async getProductDetailWithStock(
    id_producto: number,
    id_sede: number,
  ): Promise<{ product: ProductOrmEntity | null; stock: StockOrmEntity | null }> {
    const product = await this.repository.findOne({
      where: { id_producto },
      relations: ['categoria'],
    });

    if (!product) {
      return { product: null, stock: null };
    }

    // Traemos 1 registro de stock (si tienes varios por almacén, luego podemos consolidar)
    const stock = await this.stockRepository.findOne({
      where: {
        id_sede: String(id_sede),
        producto: { id_producto },
      },
      relations: ['almacen', 'producto'],
      order: { id_stock: 'ASC' },
    });

    return { product, stock: stock ?? null };
  }

  // ===============================
  //  Autocomplete (máx 5) limitado por sede y opcional por categoría
  // ===============================
  async autocompleteProducts(
    dto: ProductAutocompleteQueryDto,
  ): Promise<Array<{ id_producto: number; codigo: string; nombre: string; stock: number }>> {
    const search = dto.search.trim();

    const qb = this.stockRepository
      .createQueryBuilder('stock')
      .innerJoin('stock.producto', 'producto')
      .where('stock.id_sede = :id_sede', { id_sede: dto.id_sede })
      .andWhere('producto.estado = :estado', { estado: true });

    if (dto.id_categoria) {
      qb.andWhere('producto.id_categoria = :id_categoria', {
        id_categoria: dto.id_categoria,
      });
    }

    qb.andWhere(
      new Brackets((w) => {
        w.where('producto.codigo LIKE :search', { search: `%${search}%` }).orWhere(
          'producto.anexo LIKE :search',
          { search: `%${search}%` },
        );
      }),
    );

    qb.select([
      'producto.id_producto AS id_producto',
      'producto.codigo AS codigo',
      'producto.anexo AS nombre',
      'COALESCE(SUM(stock.cantidad), 0) AS stock',
    ])
      .groupBy('producto.id_producto')
      .addGroupBy('producto.codigo')
      .addGroupBy('producto.anexo')
      .orderBy('producto.codigo', 'ASC')
      .limit(5);

    const rows = await qb.getRawMany();

    return rows.map((r) => ({
      id_producto: Number(r.id_producto),
      codigo: r.codigo,
      nombre: r.nombre,
      stock: Number(r.stock),
    }));
  }
}