/* ============================================
   APPLICATION LAYER - QUERY SERVICE
   logistics/src/core/catalog/product/application/service/product-query.service.ts
   ============================================ */

import { Inject, Injectable } from '@nestjs/common';
import { IProductQueryPort } from '../../domain/ports/in/product-port-in';
import { IProductRepositoryPort } from '../../domain/ports/out/product-ports-out';
import { ListProductFilterDto } from '../dto/in';
import { ProductResponseDto, ProductListResponse } from '../dto/out';
import { ProductMapper } from '../mapper/product.mapper';

@Injectable()
export class ProductQueryService implements IProductQueryPort {
  constructor(
    @Inject('IProductRepositoryPort')
    private readonly repository: IProductRepositoryPort,
  ) {}

  /**
   * Obtiene la lista paginada para la tabla de MKapu Import
   */
  async listProducts(filters: ListProductFilterDto): Promise<ProductListResponse> {
    // Definimos los valores por defecto para que coincida con la UI (5x5)
    const limit = filters.limit ? Number(filters.limit) : 5;
    const page = filters.page ? Number(filters.page) : 1;

    // IMPORTANTE: El repositorio devuelve una tupla [entidades, total]
    // Esto resuelve el error de "total, page, limit" subrayado
    const [products, total] = await this.repository.findAll({
      ...filters,
      limit,
      page,
    });

    // Enviamos los 4 parámetros al Mapper para construir el objeto meta
    return ProductMapper.toListResponse(products, total, page, limit);
  }

  async getProductById(id: number): Promise<ProductResponseDto | null> {
    const product = await this.repository.findById(id);
    return product ? ProductMapper.toResponseDto(product) : null;
  }

  async getProductByCode(codigo: string): Promise<ProductResponseDto | null> {
    const product = await this.repository.findByCode(codigo);
    return product ? ProductMapper.toResponseDto(product) : null;
  }

  async getProductsByCategory(id_categoria: number): Promise<ProductListResponse> {
    // Para categorías usamos un límite mayor pero mantenemos la estructura
    const [products, total] = await this.repository.findAll({ 
      id_categoria, 
      limit: 50, 
      page: 1 
    });
    return ProductMapper.toListResponse(products, total, 1, 50);
  }
}