/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { IProductQueryPort } from '../../domain/ports/in/product-port-in';
import { IProductRepositoryPort } from '../../domain/ports/out/product-ports-out';
import {
  ListProductFilterDto,
  ListProductStockFilterDto,
  ProductAutocompleteQueryDto,
} from '../dto/in';
import {
  ProductResponseDto,
  ProductListResponse,
  ListProductStockResponseDto,
  ProductStockItemDto,
  PaginationDto,
  ProductAutocompleteResponseDto,
  ProductAutocompleteItemDto,
  ProductDetailWithStockResponseDto,
  ProductStockVentasItemDto,
  ProductAutocompleteVentasResponseDto,
  ProductAutocompleteVentasItemDto,
  CategoriaConStockDto,
} from '../dto/out';
import { ProductMapper } from '../mapper/product.mapper';
import { SedeTcpProxy } from '../../infrastructure/adapters/out/TCP/sede-tcp.proxy';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { ProductOrmEntity } from '../../infrastructure/entity/product-orm.entity';

@Injectable()
export class ProductQueryService implements IProductQueryPort {
  constructor(
    @Inject('IProductRepositoryPort')
    private readonly repository: IProductRepositoryPort,
    private readonly sedeTcpProxy: SedeTcpProxy,
    @InjectRepository(ProductOrmEntity)
    private readonly productRepo: Repository<ProductOrmEntity>,
  ) {}

  async listProducts(
    filters: ListProductFilterDto,
  ): Promise<ProductListResponse> {
    const limit = filters.limit ? Number(filters.limit) : 5;
    const page = filters.page ? Number(filters.page) : 1;

    const [products, total] = await this.repository.findAll({
      ...filters,
      limit,
      page,
    });

    return ProductMapper.toListResponse(products, total, page, limit);
  }

  async listProductsStock(
    filters: ListProductStockFilterDto,
  ): Promise<ListProductStockResponseDto> {
    const { page = 1, size = 10, id_sede } = filters;

    const [stocks, total] = await this.repository.findProductsStock(
      filters,
      page,
      size,
    );

    let sedeName = `Sede ${id_sede}`;
    try {
      const sedeInfo = await this.sedeTcpProxy.getSedeById(String(id_sede));
      if (sedeInfo?.nombre) sedeName = sedeInfo.nombre;
    } catch (error: any) {
      console.warn(
        '⚠️ No se pudo obtener info de sede via TCP:',
        error?.message ?? error,
      );
    }

    const data: ProductStockItemDto[] = stocks.map((stock) => ({
      id_producto: stock.id_producto,
      codigo: stock.producto.codigo,
      nombre: stock.producto.anexo,
      familia: stock.producto.categoria?.nombre || '',
      sede: sedeName,
      stock: stock.cantidad,
    }));

    const pagination: PaginationDto = {
      page,
      size,
      total_records: total,
      total_pages: Math.ceil(total / size),
    };

    return { data, pagination };
  }

  async autocompleteProducts(
    dto: ProductAutocompleteQueryDto,
  ): Promise<ProductAutocompleteResponseDto> {
    const items = await this.repository.autocompleteProducts(dto);

    const data: ProductAutocompleteItemDto[] = items.map((p) => ({
      id_producto: p.id_producto,
      codigo: p.codigo,
      nombre: p.nombre,
      stock: Number(p.stock),
    }));

    return { data };
  }

  async getProductDetailWithStock(
    id_producto: number,
    id_sede: number,
  ): Promise<ProductDetailWithStockResponseDto> {
    const { product, stock } = await this.repository.getProductDetailWithStock(
      id_producto,
      id_sede,
    );

    if (!product) {
      throw new NotFoundException(`Producto ${id_producto} no existe`);
    }
    if (!stock) {
      throw new NotFoundException(
        `No hay stock del producto ${id_producto} en la sede ${id_sede}`,
      );
    }

    let sedeNombre = `Sede ${id_sede}`;
    try {
      const sedeInfo = await this.sedeTcpProxy.getSedeById(String(id_sede));
      if (sedeInfo?.nombre) sedeNombre = sedeInfo.nombre;
    } catch {
      // fallback
    }

    return ProductMapper.toDetailWithStockResponse({
      product,
      stock,
      sedeNombre,
      id_sede,
    });
  }

  async getProductDetailWithStockByCode(
    codigo: string,
    id_sede: number,
  ): Promise<ProductDetailWithStockResponseDto> {
    const product = await this.repository.findByCode(codigo);

    if (!product) {
      throw new NotFoundException(`Producto no existe: ${codigo}`);
    }

    return this.getProductDetailWithStock(product.id_producto, id_sede);
  }

  async getProductById(id: number): Promise<ProductResponseDto> {
    const product = await this.repository.findById(id);
    if (!product) throw new NotFoundException(`Producto no encontrado: ${id}`);
    return ProductMapper.toResponseDto(product);
  }

  async getProductByCode(codigo: string): Promise<ProductResponseDto> {
    const product = await this.repository.findByCode(codigo);
    if (!product)
      throw new NotFoundException(`Producto no encontrado: ${codigo}`);
    return ProductMapper.toResponseDto(product);
  }

  async getProductsByCategory(
    id_categoria: number,
  ): Promise<ProductListResponse> {
    const [products, total] = await this.repository.findAll({
      id_categoria,
      limit: 50,
      page: 1,
    });
    return ProductMapper.toListResponse(products, total, 1, 50);
  }
  async getProductsWeightsByIds(ids: string[]) {
    if (!ids || ids.length === 0) return [];

    const products = await this.productRepo.find({
      where: {
        id_producto: In(ids),
      },
      select: ['id_producto', 'peso_unitario'],
    });

    return products.map((p) => ({
      id: p.id_producto,
      peso: Number(p.peso_unitario) || 0,
    }));
  }

  async autocompleteProductsVentas(
    dto: ProductAutocompleteQueryDto,
  ): Promise<ProductAutocompleteVentasResponseDto> {
    const rows = await this.repository.autocompleteProductsVentas(
      dto.id_sede,
      dto.search,
      dto.id_categoria,
    );

    const data: ProductAutocompleteVentasItemDto[] = rows.map((r) => ({
      id_producto: r.id_producto,
      codigo: r.codigo,
      nombre: r.nombre,
      stock: r.stock,
      precio_unitario: r.precio_unitario,
      precio_caja: r.precio_caja,
      precio_mayor: r.precio_mayor,
      id_categoria: r.id_categoria,
      familia: r.familia,
    }));

    return { data };
  }

  async getProductsStockVentas(
    dto: ProductAutocompleteQueryDto,
    page: number = 1,
    size: number = 10,
  ): Promise<{ data: ProductStockVentasItemDto[]; pagination: PaginationDto }> {
    let sedeName = `Sede ${dto.id_sede}`;
    try {
      const sedeInfo = await this.sedeTcpProxy.getSedeById(String(dto.id_sede));
      if (sedeInfo?.nombre) sedeName = sedeInfo.nombre;
    } catch {}

    const [rows, total] = await this.repository.getProductsStockVentas(
      dto.id_sede,
      page,
      size,
      dto.search,
      dto.id_categoria,
    );

    const data: ProductStockVentasItemDto[] = rows.map((r) => ({
      id_producto: r.id_producto,
      codigo: r.codigo,
      nombre: r.nombre,
      familia: r.familia,
      id_categoria: r.id_categoria,
      sede: sedeName,
      stock: r.stock,
      precio_unitario: r.precio_unitario,
      precio_caja: r.precio_caja,
      precio_mayor: r.precio_mayor,
    }));

    const pagination: PaginationDto = {
      page,
      size,
      total_records: total,
      total_pages: Math.ceil(total / size),
    };

    return { data, pagination };
  }

  async getCategoriasConStock(
    id_sede: number,
  ): Promise<CategoriaConStockDto[]> {
    const rows = await this.repository.getCategoriaConStock(id_sede);
    return rows.map((r) => ({
      id_categoria: r.id_categoria,
      nombre: r.nombre,
      total_productos: r.total_productos,
    }));
  }

  async getProductsCodigoByIds(
    ids: number[],
  ): Promise<{ id_producto: number; codigo: string }[]> {
    if (!ids || ids.length === 0) return [];
    const products = await this.productRepo.find({
      where: { id_producto: In(ids) },
      select: ['id_producto', 'codigo'],
    });
    return products.map((p) => ({
      id_producto: p.id_producto,
      codigo: p.codigo,
    }));
  }
}
