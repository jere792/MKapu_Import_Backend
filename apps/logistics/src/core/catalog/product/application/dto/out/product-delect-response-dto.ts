// logistics/src/core/catalog/product/application/dto/out/product-deleted-response-dto.ts

export interface ProductDeletedResponseDto {
  id_producto: number;
  message: string;
  inactiveAt: Date; // Cambiado de deletedAt a inactiveAt
  estado: boolean;  // Confirmamos que el estado ahora es false
}