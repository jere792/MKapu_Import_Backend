import { PaginationDto } from './pagination.dto';
import { ProductStockVentasItemDto } from './product-stock-ventas-item.dto';

export class ListProductStockVentasResponseDto {
  data: ProductStockVentasItemDto[];
  pagination: PaginationDto;
}
