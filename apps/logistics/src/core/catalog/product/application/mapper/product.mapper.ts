/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* ============================================
   APPLICATION LAYER - MAPPER
   logistics/src/core/catalog/product/application/mapper/product.mapper.ts
   ============================================ */

import { Product } from '../../domain/entity/product-domain-entity';
import {
  RegisterProductDto,
  UpdateProductDto,
  UpdateProductPricesDto,
} from '../dto/in';
import {
  ProductResponseDto,
  ProductListResponse,
  ProductDeletedResponseDto,
  ProductDetailWithStockResponseDto,
} from '../dto/out';
import { ProductOrmEntity } from '../../infrastructure/entity/product-orm.entity';
import { StockOrmEntity } from '../../infrastructure/entity/stock-orm.entity';
import { CategoryOrmEntity } from '../../../category/infrastructure/entity/category-orm.entity';

export class ProductMapper {
  static toResponseDto(product: Product): ProductResponseDto {
    return {
      id_producto: product.id_producto!,
      id_categoria: product.id_categoria,
      categoriaNombre: product.categoriaNombre,
      codigo: product.codigo,
      anexo: product.anexo,
      descripcion: product.descripcion,
      pre_compra: product.pre_compra,
      pre_venta: product.pre_venta,
      pre_unit: product.pre_unit,
      pre_may: product.pre_may,
      pre_caja: product.pre_caja,
      uni_med: product.uni_med,
      estado: product.estado!,
      fec_creacion: product.fec_creacion!,
      fec_actual: product.fec_actual!,
      profitMargin: product.getProfitMargin(),
    };
  }

  static toListResponse(
    products: Product[],
    total: number,
    page: number,
    limit: number,
  ): ProductListResponse {
    return {
      products: products.map((p) => this.toResponseDto(p)),
      total,
      meta: {
        totalItems: total,
        itemsPerPage: limit,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
      },
    };
  }

  static fromRegisterDto(dto: RegisterProductDto): Product {
    return Product.create({
      id_categoria: dto.id_categoria,
      codigo: dto.codigo,
      anexo: dto.anexo,
      descripcion: dto.descripcion,
      pre_compra: dto.pre_compra,
      pre_venta: dto.pre_venta,
      pre_unit: dto.pre_unit,
      pre_may: dto.pre_may,
      pre_caja: dto.pre_caja,
      uni_med: dto.uni_med,
      estado: true,
      fec_creacion: new Date(),
      fec_actual: new Date(),
    });
  }

  static fromUpdateDto(product: Product, dto: UpdateProductDto): Product {
    return Product.create({
      id_producto: product.id_producto,
      id_categoria: dto.id_categoria ?? product.id_categoria,
      codigo: dto.codigo ?? product.codigo,
      anexo: dto.anexo ?? product.anexo,
      descripcion: dto.descripcion ?? product.descripcion,
      pre_compra: product.pre_compra,
      pre_venta: product.pre_venta,
      pre_unit: product.pre_unit,
      pre_may: product.pre_may,
      pre_caja: product.pre_caja,
      uni_med: dto.uni_med ?? product.uni_med,
      estado: product.estado,
      fec_creacion: product.fec_creacion,
      fec_actual: new Date(),
    });
  }

  static fromUpdatePricesDto(product: Product, dto: UpdateProductPricesDto): Product {
    return product.updatePrices({
      pre_compra: dto.pre_compra,
      pre_venta: dto.pre_venta,
      pre_unit: dto.pre_unit,
      pre_may: dto.pre_may,
      pre_caja: dto.pre_caja,
    });
  }

  static withStatus(product: Product, estado: boolean): Product {
    return Product.create({
      id_producto: product.id_producto,
      id_categoria: product.id_categoria,
      codigo: product.codigo,
      anexo: product.anexo,
      descripcion: product.descripcion,
      pre_compra: product.pre_compra,
      pre_venta: product.pre_venta,
      pre_unit: product.pre_unit,
      pre_may: product.pre_may,
      pre_caja: product.pre_caja,
      uni_med: product.uni_med,
      estado: estado,
      fec_creacion: product.fec_creacion,
      fec_actual: new Date(),
    });
  }

  static toDeletedResponse(id_producto: number): ProductDeletedResponseDto {
    return {
      id_producto,
      message: 'Producto desactivado exitosamente',
      inactiveAt: new Date(),
      estado: false,
    };
  }

  static toDomainEntity(productOrm: ProductOrmEntity): Product {
    return Product.create({
      id_producto: productOrm.id_producto,
      id_categoria: productOrm.categoria?.id_categoria,
      codigo: productOrm.codigo,
      anexo: productOrm.anexo,
      descripcion: productOrm.descripcion,
      pre_compra: Number(productOrm.pre_compra),
      pre_venta: Number(productOrm.pre_venta),
      pre_unit: Number(productOrm.pre_unit),
      pre_may: Number(productOrm.pre_may),
      pre_caja: Number(productOrm.pre_caja),
      uni_med: productOrm.uni_med,
      estado: productOrm.estado,
      fec_creacion: productOrm.fec_creacion,
      fec_actual: productOrm.fec_actual,
      categoriaNombre: productOrm.categoria?.nombre,
    });
  }

  static toOrmEntity(product: Product): ProductOrmEntity {
    const productOrm = new ProductOrmEntity();
    if (product.id_producto) {
      productOrm.id_producto = product.id_producto;
    }
    productOrm.categoria = { id_categoria: product.id_categoria } as CategoryOrmEntity;
    productOrm.codigo = product.codigo;
    productOrm.anexo = product.anexo;
    productOrm.descripcion = product.descripcion;
    productOrm.pre_compra = product.pre_compra;
    productOrm.pre_venta = product.pre_venta;
    productOrm.pre_unit = product.pre_unit;
    productOrm.pre_may = product.pre_may;
    productOrm.pre_caja = product.pre_caja;
    productOrm.uni_med = product.uni_med;
    productOrm.estado = product.estado ?? true;
    productOrm.fec_creacion = product.fec_creacion ?? new Date();
    productOrm.fec_actual = product.fec_actual ?? new Date();
    return productOrm;
  }

  static toDetailWithStockResponse(params: {
    product: ProductOrmEntity;
    stock: StockOrmEntity;
    sedeNombre: string;
    id_sede: number;
  }): ProductDetailWithStockResponseDto {
    const { product, stock, sedeNombre, id_sede } = params;

    return {
      producto: {
        id_producto: product.id_producto,
        codigo: product.codigo,
        nombre: product.anexo,
        descripcion: product.descripcion,
        categoria: {
          id_categoria: product.categoria?.id_categoria,
          nombre: product.categoria?.nombre,
        },
        precio_compra: Number(product.pre_compra),
        precio_unitario: Number(product.pre_unit),
        precio_mayor: Number(product.pre_may),
        precio_caja: Number(product.pre_caja),
        unidad_medida: {
          id: null,
          nombre: product.uni_med,
        },
        estado: product.estado ? 1 : 0,
        fecha_creacion:
          product.fec_creacion instanceof Date
            ? product.fec_creacion.toISOString()
            : new Date(product.fec_creacion).toISOString(),
        fecha_edicion:
          product.fec_actual instanceof Date
            ? product.fec_actual.toISOString()
            : new Date(product.fec_actual).toISOString(),
      },
      stock: {
        id_sede,
        sede: sedeNombre,
        id_almacen: stock.almacen?.id_almacen ?? null,
        cantidad: Number(stock.cantidad),
        estado: stock.estado,
      },
    };
  }
}