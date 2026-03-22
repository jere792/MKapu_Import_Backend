/* eslint-disable @typescript-eslint/unbound-method */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Brackets } from 'typeorm';

import {
  IProductRepositoryPort,
  ProductAutocompleteVentasRaw,
  ProductStockVentasRaw,
  CategoriaConStockRaw,
} from '../../../../domain/ports/out/product-ports-out';

import { Product } from '../../../../domain/entity/product-domain-entity';
import { ProductOrmEntity } from '../../../entity/product-orm.entity';
import { ProductMapper } from '../../../../application/mapper/product.mapper';
import {
  ListProductFilterDto,
  ListProductStockFilterDto,
  ProductAutocompleteQueryDto,
} from '../../../../application/dto/in';
import { StockOrmEntity } from 'apps/logistics/src/core/warehouse/inventory/infrastructure/entity/stock-orm-entity';

@Injectable()
export class ProductTypeOrmRepository implements IProductRepositoryPort {
  constructor(
    @InjectRepository(ProductOrmEntity)
    private readonly repository: Repository<ProductOrmEntity>,

    @InjectRepository(StockOrmEntity)
    private readonly stockRepository: Repository<StockOrmEntity>,
  ) {}

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
  async findProductsStock(
    filters: ListProductStockFilterDto,
    page: number,
    size: number,
  ): Promise<[StockOrmEntity[], number]> {
    const { id_sede, codigo, nombre, id_categoria, categoria, activo } =
      filters;

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
  ): Promise<{
    product: ProductOrmEntity | null;
    stock: StockOrmEntity | null;
  }> {
    const product = await this.repository.findOne({
      where: { id_producto },
      relations: ['categoria'],
    });

    if (!product) {
      return { product: null, stock: null };
    }

    const stock = await this.stockRepository.findOne({
      where: {
        id_sede: String(id_sede),
        id_producto: id_producto,
      },
      relations: ['almacen', 'producto'],
      order: { id_stock: 'ASC' },
    });

    return { product, stock: stock ?? null };
  }
  async autocompleteProducts(dto: ProductAutocompleteQueryDto): Promise<
    Array<{
      id_producto: number;
      codigo: string;
      nombre: string;
      stock: number;
    }>
  > {
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
        w.where('producto.codigo LIKE :search', {
          search: `%${search}%`,
        }).orWhere('producto.anexo LIKE :search', { search: `%${search}%` });
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

  async autocompleteProductsVentas(
    id_sede: number,
    search?: string,
    id_categoria?: number,
  ): Promise<ProductAutocompleteVentasRaw[]> {
    const qb = this.stockRepository
      .createQueryBuilder('stock')
      .innerJoin('stock.producto', 'producto')
      .innerJoin('producto.categoria', 'categoria')
      .where('stock.id_sede = :id_sede', { id_sede: String(id_sede) })
      .andWhere('producto.estado = true');

    if (id_categoria) {
      qb.andWhere('producto.id_categoria = :id_categoria', { id_categoria });
    }

    if (search && search.length >= 2) {
      qb.andWhere(
        new Brackets((w) => {
          w.where('producto.codigo LIKE :search', {
            search: `%${search}%`,
          }).orWhere('producto.anexo LIKE :search', { search: `%${search}%` });
        }),
      );
    }

    qb.select([
      'producto.id_producto     AS id_producto',
      'producto.codigo          AS codigo',
      'producto.anexo           AS nombre',
      'categoria.id_categoria   AS id_categoria',
      'categoria.nombre         AS familia',
      'COALESCE(SUM(stock.cantidad), 0) AS stock',
      'producto.pre_unit        AS precio_unitario',
      'producto.pre_caja        AS precio_caja',
      'producto.pre_may         AS precio_mayor',
    ])
      .groupBy('producto.id_producto')
      .addGroupBy('producto.codigo')
      .addGroupBy('producto.anexo')
      .addGroupBy('categoria.id_categoria')
      .addGroupBy('categoria.nombre')
      .addGroupBy('producto.pre_unit')
      .addGroupBy('producto.pre_caja')
      .addGroupBy('producto.pre_may')
      .orderBy('COALESCE(SUM(stock.cantidad), 0)', 'DESC')
      .addOrderBy('producto.codigo', 'ASC')
      .limit(10);

    const rows = await qb.getRawMany();

    return rows.map((r) => ({
      id_producto: Number(r.id_producto),
      codigo: r.codigo,
      nombre: r.nombre,
      id_categoria: Number(r.id_categoria),
      familia: r.familia,
      stock: Number(r.stock),
      precio_unitario: Number(r.precio_unitario),
      precio_caja: Number(r.precio_caja),
      precio_mayor: Number(r.precio_mayor),
    }));
  }

  async getProductsStockVentas(
    id_sede: number,
    page: number,
    size: number,
    search?: string,
    id_categoria?: number,
  ): Promise<[ProductStockVentasRaw[], number]> {
    const qb = this.stockRepository
      .createQueryBuilder('stock')
      .innerJoin('stock.producto', 'producto')
      .innerJoin('producto.categoria', 'categoria')
      .where('stock.id_sede = :id_sede', { id_sede: String(id_sede) })
      .andWhere('producto.estado = true')
      .andWhere('stock.cantidad > 0');

    if (id_categoria) {
      qb.andWhere('producto.id_categoria = :id_categoria', { id_categoria });
    }

    if (search) {
      qb.andWhere(
        new Brackets((w) => {
          w.where('producto.codigo LIKE :search', {
            search: `%${search}%`,
          }).orWhere('producto.anexo LIKE :search', { search: `%${search}%` });
        }),
      );
    }

    // ── Columnas compartidas por COUNT y datos ───────────────────────────────
    const groupBy = [
      'producto.id_producto',
      'producto.codigo',
      'producto.anexo',
      'categoria.nombre',
      'categoria.id_categoria',
      'producto.pre_unit',
      'producto.pre_caja',
      'producto.pre_may',
    ];

    // ── COUNT con subquery — UNA sola query extra ligera ─────────────────────
    const countQb = qb.clone();
    countQb
      .select('COUNT(DISTINCT producto.id_producto) AS total')
      .groupBy(undefined as any); // resetear groupBy para el count global

    // TypeORM no tiene .resetGroupBy(), usamos raw count con subquery
    const countResult = await this.stockRepository
      .createQueryBuilder('stock')
      .innerJoin('stock.producto', 'producto')
      .innerJoin('producto.categoria', 'categoria')
      .where('stock.id_sede = :id_sede', { id_sede: String(id_sede) })
      .andWhere('producto.estado = true')
      .andWhere('stock.cantidad > 0')
      .andWhere(
        id_categoria ? 'producto.id_categoria = :id_categoria' : '1=1',
        id_categoria ? { id_categoria } : {},
      )
      .andWhere(
        search
          ? new Brackets((w) => {
              w.where('producto.codigo LIKE :search', {
                search: `%${search}%`,
              }).orWhere('producto.anexo LIKE :search', {
                search: `%${search}%`,
              });
            })
          : '1=1',
      )
      .select('COUNT(DISTINCT producto.id_producto) AS total')
      .getRawOne();

    const total = Number(countResult?.total ?? 0);

    // ── Query paginada ────────────────────────────────────────────────────────
    qb.select([
      'producto.id_producto     AS id_producto',
      'producto.codigo          AS codigo',
      'producto.anexo           AS nombre',
      'categoria.nombre         AS familia',
      'categoria.id_categoria   AS id_categoria',
      'COALESCE(SUM(stock.cantidad), 0) AS stock',
      'producto.pre_unit        AS precio_unitario',
      'producto.pre_caja        AS precio_caja',
      'producto.pre_may         AS precio_mayor',
    ]);

    groupBy.forEach((g, i) => (i === 0 ? qb.groupBy(g) : qb.addGroupBy(g)));

    qb.orderBy('producto.codigo', 'ASC')
      .offset((page - 1) * size)
      .limit(size);

    const rows = await qb.getRawMany();

    const data = rows.map((r) => ({
      id_producto: Number(r.id_producto),
      codigo: r.codigo,
      nombre: r.nombre,
      familia: r.familia,
      id_categoria: Number(r.id_categoria),
      stock: Number(r.stock),
      precio_unitario: Number(r.precio_unitario),
      precio_caja: Number(r.precio_caja),
      precio_mayor: Number(r.precio_mayor),
    }));

    return [data, total];
  }

  async getCategoriaConStock(id_sede: number): Promise<CategoriaConStockRaw[]> {
    const rows = await this.stockRepository
      .createQueryBuilder('stock')
      .innerJoin('stock.producto', 'producto')
      .innerJoin('producto.categoria', 'categoria')
      .where('stock.id_sede = :id_sede', { id_sede: String(id_sede) })
      .andWhere('producto.estado = true')
      .andWhere('stock.cantidad > 0')
      .select([
        'categoria.id_categoria  AS id_categoria',
        'categoria.nombre        AS nombre',
        'COUNT(DISTINCT producto.id_producto) AS total_productos',
      ])
      .groupBy('categoria.id_categoria')
      .addGroupBy('categoria.nombre')
      .orderBy('categoria.nombre', 'ASC')
      .getRawMany();

    return rows.map((r) => ({
      id_categoria: Number(r.id_categoria),
      nombre: r.nombre,
      total_productos: Number(r.total_productos),
    }));
  }
  async searchAutocompleteByCode(codigo: string): Promise<any[]> {
    const result = await this.repository
      .createQueryBuilder('p')
      .select([
        'p.id_producto AS id_producto',
        'p.codigo AS codigo',
        'p.descripcion AS descripcion',
        'p.pre_venta AS pre_venta',
        'COALESCE(SUM(s.cantidad), 0) AS stock',
      ])
      .leftJoin(StockOrmEntity, 's', 's.id_producto = p.id_producto')
      .where('p.codigo LIKE :codigo', { codigo: `%${codigo}%` })
      .andWhere('p.estado = :estado', { estado: true })
      .groupBy('p.id_producto')
      .limit(10)
      .getRawMany();

    return result;
  }
}
