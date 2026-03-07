import { CreateInventoryMovementDto } from '../dto/in/create-inventory-movement.dto';
import {
  InventoryMovement,
  InventoryDetail,
} from '../../domain/entity/inventory-movement.entity';
import { Stock } from '../../domain/entity/stock-domain-entity';
import { StockResponseDto } from '../dto/out/stock-response.dto';

export class InventoryMapper {
  static toDomain(dto: CreateInventoryMovementDto): InventoryMovement {
    const details = dto.items.map(
      (item) =>
        new InventoryDetail(
          item.productId,
          item.warehouseId,
          item.quantity,
          item.type,
        ),
    );

    return new InventoryMovement({
      originType: dto.originType,
      refId: dto.refId,
      refTable: dto.refTable,
      observation: dto.observation,
      items: details,
      date: new Date(),
    });
  }
  static toStockResponseDto(domain: Stock): StockResponseDto {
    return {
      productId: domain.productId,
      warehouseId: domain.warehouseId,
      quantity: domain.quantity,
      headquartersId: domain.headquartersId,
      status: domain.status,
    };
  }
}
