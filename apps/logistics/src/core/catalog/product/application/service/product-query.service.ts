/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { IProductQueryPort } from '../../domain/ports/in/product-port-in';
import { IProductRepositoryPort } from '../../domain/ports/out/product-ports-out';
import {
  ListProductFilterDto,
  ListProductStockFilterDto,
  ProductAutocompleteQueryDto,
  ProductAutocompleteVentasQueryDto,
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
  ListProductStockVentasResponseDto,
  ProductStockVentasItemDto,
  ProductAutocompleteVentasResponseDto,
  ProductAutocompleteVentasItemDto,
} from '../dto/out';
import { ProductMapper } from '../mapper/product.mapper';
import { SedeTcpProxy } from '../../infrastructure/adapters/out/TCP/sede-tcp.proxy';

@Injectable()
export class ProductQueryService implements IProductQueryPort {
  constructor(
    @Inject('IProductRepositoryPort')
    private readonly repository: IProductRepositoryPort,
    private readonly sedeTcpProxy: SedeTcpProxy,
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

  // Nuevo método al final del service
  async listProductsStockVentas(
    filters: ListProductStockFilterDto,
  ): Promise<ListProductStockVentasResponseDto> {
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
      console.warn('⚠️ TCP sede error:', error?.message ?? error);
    }

    const data: ProductStockVentasItemDto[] = stocks.map((stock) => ({
      id_producto: stock.id_producto,
      codigo: stock.producto.codigo,
      nombre: stock.producto.anexo,
      familia: stock.producto.categoria?.nombre || '',
      id_categoria: stock.producto.categoria?.id_categoria ?? 0,
      sede: sedeName,
      stock: stock.cantidad,
      precio_unitario: Number(stock.producto.pre_unit) || 0,
      precio_caja: Number(stock.producto.pre_caja) || 0,
      precio_mayor: Number(stock.producto.pre_may) || 0,
    }));

    return {
      data,
      pagination: {
        page,
        size,
        total_records: total,
        total_pages: Math.ceil(total / size),
      },
    };
  }

  async autocompleteProductsVentas(
    dto: ProductAutocompleteVentasQueryDto,
  ): Promise<ProductAutocompleteVentasResponseDto> {
    const items = await this.repository.autocompleteProductsVentas(dto);

    const data: ProductAutocompleteVentasItemDto[] = items.map((p) => ({
      id_producto: p.id_producto,
      codigo: p.codigo,
      nombre: p.nombre,
      stock: p.stock,
      precio_unitario: p.precio_unitario,
      precio_caja: p.precio_caja,
      precio_mayor: p.precio_mayor,
      id_categoria: p.id_categoria,
      familia: p.familia,
    }));

    return { data };
  }

  async getCategoriasConStock(id_sede: number) {
    return this.repository.findCategoriasConStock(id_sede);
  }
}
