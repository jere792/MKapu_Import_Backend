// logistics/src/core/catalog/product/application/dto/out/product-list-response.ts
import { ProductResponseDto } from './product-response-dto';

export interface ProductListResponse {
  products: ProductResponseDto[]; // Los datos de la página actual
  total: number; // El total real de la base de datos (ej. 24)
  meta?: {
    totalItems: number;
    itemsPerPage: number;
    totalPages: number;
    currentPage: number;
  };
}