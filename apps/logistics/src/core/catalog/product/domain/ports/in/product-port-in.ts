/* ============================================
   logistics/src/core/catalog/product/domain/ports/in/product-port-in.ts
   ============================================ */

import {
  RegisterProductDto,
  UpdateProductDto,
  UpdateProductPricesDto,
  ChangeProductStatusDto,
  ListProductFilterDto,
  ListProductStockFilterDto,
  ProductAutocompleteQueryDto,
  ProductAutocompleteVentasQueryDto,
} from '../../../application/dto/in';

import {
  ProductResponseDto,
  ProductListResponse,
  ProductDeletedResponseDto,
  ListProductStockResponseDto,
  ProductAutocompleteResponseDto,
  ProductDetailWithStockResponseDto,
  ProductAutocompleteVentasResponseDto,
} from '../../../application/dto/out';

export interface IProductCommandPort {
  registerProduct(dto: RegisterProductDto): Promise<ProductResponseDto>;
  updateProduct(dto: UpdateProductDto): Promise<ProductResponseDto>;
  updateProductPrices(dto: UpdateProductPricesDto): Promise<ProductResponseDto>;
  changeProductStatus(dto: ChangeProductStatusDto): Promise<ProductResponseDto>;
  deleteProduct(id: number): Promise<ProductDeletedResponseDto>;
}

export interface IProductQueryPort {
  // existentes
  listProducts(filters?: ListProductFilterDto): Promise<ProductListResponse>;
  getProductById(id: number): Promise<ProductResponseDto | null>;
  getProductByCode(codigo: string): Promise<ProductResponseDto | null>;
  getProductsByCategory(id_categoria: number): Promise<ProductListResponse>;

  listProductsStock(
    filters: ListProductStockFilterDto,
  ): Promise<ListProductStockResponseDto>;

  autocompleteProducts(
    dto: ProductAutocompleteQueryDto,
  ): Promise<ProductAutocompleteResponseDto>;

  getProductDetailWithStock(
    id_producto: number,
    id_sede: number,
  ): Promise<ProductDetailWithStockResponseDto>;

  autocompleteProductsVentas(
  dto: ProductAutocompleteVentasQueryDto,
): Promise<ProductAutocompleteVentasResponseDto>;  

}