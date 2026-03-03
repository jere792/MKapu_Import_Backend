import { InventoryMovement } from '../../entity/inventory-movement.entity';
import { Stock } from '../../entity/stock-domain-entity';

export interface IInventoryRepositoryPort {
  saveMovement(movement: InventoryMovement): Promise<void>;
  findStock(productId: number, warehouseId: number): Promise<Stock | null>;
  updateStock(stock: Stock): Promise<void>;
  findAllMovements(filters: any): Promise<[any[], number]>;
}
